import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  mockGetNotificationPreferences,
  mockListNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
  mockSaveNotificationPreferences,
} from '@/mocks/notifications';
import {
  notificationPreferencesSchema,
  notificationSchema,
  notificationsSchema,
  type NotificationPreferences,
} from '@/schemas/notification.schema';

// Capa de servicio del centro de notificaciones. Las notificaciones y las preferencias son de
// ejemplo (Fase 4 sin backend) con la forma de los contratos proyectados.

const notificationKeys = {
  list: (userId: string | null | undefined, orgId: string | undefined) => ['notifications', userId, orgId] as const,
  preferences: (userId: string | null | undefined) => ['notification-preferences', userId] as const,
};

/** Bandeja de la organización activa, más recientes primero. */
export function useNotifications() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: notificationKeys.list(userId, organization?.id),
    // GET /notificaciones?organizacionId
    queryFn: async () => notificationsSchema.parse(mockListNotifications(organization!.id)),
    enabled: !!userId && !!organization?.id,
  });
}

/** Pendientes de la organización activa (insignia de la campana). */
export function useUnreadNotificationsCount(): number {
  const { data } = useNotifications();
  return data?.filter((item) => !item.leida).length ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useMutation({
    // PATCH /notificaciones/{notificacionId}/leer
    mutationFn: async (id: string) => notificationSchema.parse(mockMarkNotificationRead(organization!.id, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId, organization?.id) }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useMutation({
    // PATCH /notificaciones/leer-todas?organizacionId
    mutationFn: async () => mockMarkAllNotificationsRead(organization!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId, organization?.id) }),
  });
}

export function useNotificationPreferences() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: notificationKeys.preferences(userId),
    // GET /me/preferencias-notificacion
    queryFn: async () => notificationPreferencesSchema.parse(mockGetNotificationPreferences()),
    enabled: !!userId,
  });
}

export function useSaveNotificationPreferences() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    // PUT /me/preferencias-notificacion
    mutationFn: async (preferences: NotificationPreferences) =>
      notificationPreferencesSchema.parse(
        mockSaveNotificationPreferences(notificationPreferencesSchema.parse(preferences)),
      ),
    onSuccess: (saved) => queryClient.setQueryData(notificationKeys.preferences(userId), saved),
  });
}
