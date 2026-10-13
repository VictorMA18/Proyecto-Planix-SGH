import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  broadcastFormSchema,
  broadcastResultSchema,
  notificationPreferencesSchema,
  notificationSchema,
  notificationsSchema,
  pushTokenSchema,
  toBroadcastRequest,
  type BroadcastFormInput,
  type NotificationPreferences,
  type PushTokenInput,
} from '@/schemas/notification.schema';
import { usePushStore } from '@/stores/usePushStore';

import { useApiClient } from './api-client';

// Capa de servicio del centro de notificaciones (Fase 4, contra la API real).

/** Difundir avisos a toda la organización: ADMIN, SUPER_ADMIN y SUPERVISOR (contrato de difusión). */
export const canBroadcast = (role: string | undefined) =>
  role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERVISOR';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string | null | undefined, orgId: string | undefined) => ['notifications', userId, orgId] as const,
  preferences: (userId: string | null | undefined) => ['notification-preferences', userId] as const,
};

/** Bandeja de la organización activa, más recientes primero. Se refresca cada 30 s y al volver a la app. */
export function useNotifications() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: notificationKeys.list(userId, organization?.id),
    // GET /notificaciones?organizacionId&pageSize
    queryFn: async () =>
      notificationsSchema.parse(
        await api<unknown>(`/notificaciones?organizacionId=${organization!.id}&pageSize=100`),
      ),
    enabled: !!userId && !!organization?.id,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

/** Pendientes de la organización activa (insignia de la campana). */
export function useUnreadNotificationsCount(): number {
  const { data } = useNotifications();
  return data?.filter((item) => !item.leida).length ?? 0;
}

export function useMarkNotificationRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    // PATCH /notificaciones/{notificacionId}/leer
    mutationFn: async (id: string) =>
      notificationSchema.parse(await api<unknown>(`/notificaciones/${id}/leer`, { method: 'PATCH' })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { organization } = useActiveOrganization();

  return useMutation({
    // PATCH /notificaciones/leer-todas?organizacionId
    mutationFn: async () =>
      z
        .object({ actualizadas: z.number().int() })
        .parse(
          await api<unknown>(`/notificaciones/leer-todas?organizacionId=${organization!.id}`, { method: 'PATCH' }),
        ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useNotificationPreferences() {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: notificationKeys.preferences(userId),
    // GET /me/preferencias-notificacion
    queryFn: async () => notificationPreferencesSchema.parse(await api<unknown>('/me/preferencias-notificacion')),
    enabled: !!userId,
  });
}

export function useSaveNotificationPreferences() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    // PUT /me/preferencias-notificacion
    mutationFn: async (preferences: NotificationPreferences) =>
      notificationPreferencesSchema.parse(
        await api<unknown>('/me/preferencias-notificacion', {
          method: 'PUT',
          body: notificationPreferencesSchema.parse(preferences),
        }),
      ),
    onSuccess: (saved) => queryClient.setQueryData(notificationKeys.preferences(userId), saved),
  });
}

/** Envía un aviso a todo el equipo o a los miembros elegidos; llega como notificación de tipo AVISO. */
export function useBroadcastNotice() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { organization } = useActiveOrganization();

  return useMutation({
    // POST /organizaciones/{organizacionId}/notificaciones/difusion
    mutationFn: async (input: BroadcastFormInput) =>
      broadcastResultSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/notificaciones/difusion`, {
          method: 'POST',
          body: toBroadcastRequest(broadcastFormSchema.parse(input)),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

// ---------------------------------------------------------------------------------------------
// Push: registro del dispositivo o navegador

/** Registra este dispositivo (token de Expo) o navegador (suscripción Web Push) para recibir push. */
export function useRegisterPushDevice() {
  const api = useApiClient();
  const setDevice = usePushStore((state) => state.setDevice);

  return useMutation({
    // POST /push-tokens
    mutationFn: async (input: PushTokenInput) =>
      pushTokenSchema.parse(await api<unknown>('/push-tokens', { method: 'POST', body: input })),
    onSuccess: (_token, input) =>
      setDevice(
        input.plataforma === 'WEB'
          ? { endpoint: input.webPushSubscription.endpoint }
          : { expoPushToken: input.expoPushToken },
      ),
  });
}

/** Da de baja el push de este dispositivo (al cerrar sesión). No falla si no estaba registrado. */
export function useUnregisterPushDevice() {
  const api = useApiClient();

  return async () => {
    const { device, setDevice } = usePushStore.getState();
    if (!device) return;
    try {
      // DELETE /push-tokens
      await api<void>('/push-tokens', { method: 'DELETE', body: device });
    } catch (error) {
      if (__DEV__) console.warn('[push] No se pudo dar de baja el dispositivo:', error);
    } finally {
      setDevice(null);
    }
  };
}

/** Clave pública VAPID para suscribir el navegador (`null` si el servidor no tiene Web Push). */
export function useWebPushKey(enabled: boolean) {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['web-push-key', userId],
    // GET /push-tokens/clave-web
    // Un error (p. ej. 503 si el backend aún no tiene VAPID) no se guarda como dato: se reintenta
    // al volver a la pestaña, en vez de quedar «sin clave» hasta recargar.
    queryFn: async () =>
      z.object({ clavePublica: z.string() }).parse(await api<unknown>('/push-tokens/clave-web')).clavePublica,
    enabled: enabled && !!userId,
    staleTime: Infinity,
    retry: 1,
  });
}
