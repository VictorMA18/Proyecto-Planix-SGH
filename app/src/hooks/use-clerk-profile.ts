import { useUser } from '@clerk/expo';
import { useEffect } from 'react';

/**
 * Copia nombre y apellido desde `unsafeMetadata` al perfil de Clerk cuando el registro
 * los dejó solo en los metadatos.
 */
export function useClerkProfileSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const metaFirstName = user.unsafeMetadata?.firstName as string | undefined;
    const metaLastName = user.unsafeMetadata?.lastName as string | undefined;

    if ((!user.firstName && metaFirstName) || (!user.lastName && metaLastName)) {
      user
        .update({
          firstName: user.firstName || metaFirstName,
          lastName: user.lastName || metaLastName,
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);
}

/** Datos del usuario listos para mostrar, tomados de Clerk. */
export function useUserDisplay() {
  const { user, isLoaded } = useUser();

  const meta = user?.unsafeMetadata as { firstName?: string; lastName?: string } | undefined;
  const firstName = user?.firstName || meta?.firstName || '';
  const lastName = user?.lastName || meta?.lastName || '';
  const fullName = user?.fullName || `${firstName} ${lastName}`.trim() || 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    email.charAt(0).toUpperCase() ||
    'U';

  // Con contraseña habilitada se gestionan credenciales propias; una cuenta creada solo
  // con Google no tiene contraseña ni 2FA en PLANYX.
  const hasPassword = !!user?.passwordEnabled;
  const hasGoogle = !!user?.externalAccounts?.some((account) =>
    String(account.provider).includes('google')
  );

  return {
    isLoaded,
    hasPassword,
    isGoogleOnly: !hasPassword && hasGoogle,
    fullName,
    firstName: firstName || fullName.split(' ')[0],
    email,
    initials,
    imageUrl: user?.hasImage ? user.imageUrl : undefined,
    isEmailVerified: user?.primaryEmailAddress?.verification?.status === 'verified',
    // Identificador corto derivado del id de Clerk (no existe un campo propio todavía).
    publicId: user?.id ? `#PLX-${user.id.slice(-4).toUpperCase()}` : '',
  };
}
