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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Cuerpo multipart (subida de archivos). `fetch` pone el `Content-Type` con su boundary. */
  formData?: FormData;
}

/** Lo que el cliente usa de una respuesta (común a `fetch` y a `XMLHttpRequest`). */
interface MinimalResponse {
  status: number;
  ok: boolean;
  json: () => Promise<any>;
}

/**
 * Subida `multipart/form-data` en el móvil con el `XMLHttpRequest` de React Native. El `fetch`
 * global es el de Expo (desde el SDK 52) y no admite partes `{ uri, name, type }`; leer el archivo
 * con expo-file-system tampoco sirve en Expo Go para Android (la copia del selector de documentos
 * no tiene permiso de lectura: expo/expo#21792). El XHR de React Native lee la uri por su cuenta.
 */
function sendMultipartXhr(url: string, method: string, token: string, formData: FormData): Promise<MinimalResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onload = () =>
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        json: async () => (xhr.responseText ? JSON.parse(xhr.responseText) : null),
      });
    xhr.onerror = () => reject(new Error('La subida del archivo no llegó al servidor.'));
    xhr.ontimeout = () => reject(new Error('La subida del archivo tardó demasiado.'));
    xhr.send(formData);
  });
}

/** Cliente REST que adjunta el JWT de Clerk a cada petición. */
export function useApiClient() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, { method = 'GET', body, formData }: RequestOptions = {}): Promise<T> => {
      if (!BASE_URL) {
        throw new ApiError(0, 'Falta configurar EXPO_PUBLIC_API_URL.');
      }

      const send = async (token: string): Promise<MinimalResponse> => {
        try {
          if (formData && Platform.OS !== 'web') {
            return await sendMultipartXhr(`${BASE_URL}${path}`, method, token, formData);
          }
          return await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              ...(body !== undefined && !formData ? { 'Content-Type': 'application/json' } : {}),
            },
            body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
          });
        } catch (err) {
          // En desarrollo se muestra la causa real (p. ej. un cuerpo que el fetch no sabe enviar).
          const detail = __DEV__ && err instanceof Error ? ` (${err.message})` : '';
          if (__DEV__) console.warn(`[api] ${method} ${path} falló antes de responder:`, err);
          throw new ApiError(0, `No se pudo conectar con el servidor. Revisa tu conexión.${detail}`);
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

/**
 * URL absoluta de la API y cabecera con el token de Clerk, para descargas que no pasan por
 * `useApiClient` (el visor de adjuntos descarga a un archivo local o a un `Blob`).
 */
export function useApiAuth() {
  const { getToken } = useAuth();

  return useCallback(
    async (path: string) => {
      if (!BASE_URL) throw new ApiError(0, 'Falta configurar EXPO_PUBLIC_API_URL.');
      const token = await getToken();
      if (!token) throw new ApiError(401, 'Tu sesión no está disponible. Inicia sesión de nuevo.');
      return { url: `${BASE_URL}${path}`, headers: { Authorization: `Bearer ${token}` } };
    },
    [getToken]
  );
}
