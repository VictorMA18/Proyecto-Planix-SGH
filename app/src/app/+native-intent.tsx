/**
 * El navegador de Google/Clerk vuelve a la app con un deep link `…/sso-callback`. Esa URL la
 * consume `expo-web-browser`, no una pantalla: se vuelve al login en lugar de abrir una
 * ruta inexistente mientras el SSO termina de activar la sesión.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('sso-callback')) return '/(auth)/login';
  return path;
}
