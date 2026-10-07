import { useAuth } from '@clerk/expo';
import Constants from 'expo-constants';
import { useCallback } from 'react';
import { Platform } from 'react-native';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** En desarrollo, un móvil o emulador no alcanza `localhost`: se usa la IP de la máquina con Metro. */
function resolveBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
  if (!configured) return '';

  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (Platform.OS !== 'web' && __DEV__ && metroHost) {
    return configured.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${metroHost}`);
  }
  return configured;
}

const BASE_URL = resolveBaseUrl();

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/** Cliente REST que adjunta el JWT de Clerk a cada petición. */
export function useApiClient() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> => {
      if (!BASE_URL) {
        throw new ApiError(0, 'Falta configurar EXPO_PUBLIC_API_URL.');
      }

      const send = async (token: string) => {
        try {
          return await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
        } catch {
          throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
        }
      };

      const token = await getToken();
      if (!token) throw new ApiError(401, 'Tu sesión no está disponible. Inicia sesión de nuevo.');

      let response = await send(token);

      // Los tokens de Clerk duran 60 s: si expiró en el camino (o la app volvió de segundo plano),
      // se pide uno nuevo sin usar la caché y se reintenta una sola vez.
      if (response.status === 401) {
        const freshToken = await getToken({ skipCache: true });
        if (freshToken && freshToken !== token) response = await send(freshToken);
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
        throw new ApiError(response.status, message || 'Ocurrió un error inesperado.');
      }

      return (response.status === 204 ? undefined : await response.json()) as T;
    },
    [getToken]
  );
}
