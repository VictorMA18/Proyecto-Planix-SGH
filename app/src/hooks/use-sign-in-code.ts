import { useSignIn } from '@clerk/expo';

/**
 * Código de verificación por correo durante el inicio de sesión.
 *
 * Según el estado de Clerk, el código es de otro tipo:
 * - `needs_client_trust` (dispositivo nuevo) y `needs_second_factor` (verificación en dos pasos):
 *   se envía y se verifica con `signIn.mfa`.
 * - `needs_first_factor`: se usa `signIn.emailCode`.
 */
export function useSignInCode() {
  const { signIn } = useSignIn();

  const usesMfa = () =>
    signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor';

  /** Si el segundo factor de la cuenta se puede resolver con un código por correo. */
  const supportsEmailCode = () =>
    signIn.status !== 'needs_second_factor' ||
    !!signIn.supportedSecondFactors?.some((factor) => factor.strategy === 'email_code');

  /** Envía el código de correo que exige el estado actual. Devuelve un mensaje de error o `null`. */
  const sendCode = async (emailAddress: string): Promise<string | null> => {
    const { error } = usesMfa()
      ? await signIn.mfa.sendEmailCode()
      : await signIn.emailCode.sendCode({ emailAddress });
    return error ? (error.longMessage ?? error.message) : null;
  };

  /** Verifica el código. Devuelve un mensaje de error o `null`. */
  const verifyCode = async (code: string): Promise<string | null> => {
    const { error } = usesMfa()
      ? await signIn.mfa.verifyEmailCode({ code })
      : await signIn.emailCode.verifyCode({ code });
    return error ? (error.longMessage ?? error.message) : null;
  };

  return { sendCode, verifyCode, supportsEmailCode };
}
