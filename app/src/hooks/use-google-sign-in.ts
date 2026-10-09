import { useSSO } from '@clerk/expo/experimental';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';

// Expo Go no registra el esquema `app://`, así que usa una URL `exp://` que cambia con la IP.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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

      // Cierra la sesión del navegador que haya quedado abierta de un intento anterior.
      try {
        WebBrowser.dismissAuthSession();
      } catch {
        // No todas las plataformas lo admiten.
      }

      const { createdSessionId, authSessionResult } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
        // Google siempre muestra la lista de cuentas, aunque ya haya una sesión abierta en el navegador.
        oidcPrompt: 'select_account',
      });

      // Si el usuario cierra el navegador (cancelación) no se muestra error.
      if (!createdSessionId && authSessionResult?.type === 'success') {
        setError(
          isExpoGo
            ? `Google validó tu cuenta, pero Clerk no pudo completar el acceso. En Expo Go hay que permitir exactamente esta URL en el panel de Clerk (Native applications → Allowlist for mobile SSO redirect): ${redirectUrl}. Cambia cuando cambia tu IP; con un development build la URL es fija.`
            : `Google validó tu cuenta, pero Clerk no pudo completar el acceso. Permite esta URL en el panel de Clerk (Native applications → Allowlist for mobile SSO redirect): ${redirectUrl}`
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
