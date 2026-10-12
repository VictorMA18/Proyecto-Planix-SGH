import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Volver atrás sin romper la web: si la pantalla se abrió directamente (URL o recarga) no hay
 * historial y `router.back()` falla («The action 'GO_BACK' was not handled»). En ese caso se va a
 * `fallback`, una pantalla lógica de origen.
 */
export function useGoBack(fallback: Href) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
