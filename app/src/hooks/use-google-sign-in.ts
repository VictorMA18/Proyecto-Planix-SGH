import { useSSO } from '@clerk/expo/experimental';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useState } from 'react';

/**
 * Acceso o registro con Google mediante el navegador (SSO de Clerk, flujo Core 3).
 * Si la cuenta no existe se crea; al terminar, Clerk activa la sesión y el layout raíz
 * redirige a la app.
 */
export function useGoogleSignIn() {
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      // Esta URL debe estar permitida en Clerk (Native applications → redirect URLs);
      // si no, Clerk no entrega la sesión al volver del navegador.
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'sso-callback' });
      if (__DEV__) console.log(`[SSO] URL de redirección: ${redirectUrl}`);

      const { createdSessionId, authSessionResult } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      // Si el usuario cierra el navegador (cancelación) no se muestra error.
      if (!createdSessionId && authSessionResult?.type === 'success') {
        setError(
          `Google validó tu cuenta, pero Clerk no pudo completar el acceso. Verifica que ${redirectUrl} esté permitida en el panel de Clerk (Native applications).`
        );
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ||
          err?.message ||
          'Ocurrió un error al continuar con Google.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow]);

  return { signInWithGoogle, isLoading, error };
}
