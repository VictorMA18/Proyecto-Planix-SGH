import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, SectionList, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  NotificationCard,
  NotificationFilters,
  NotificationSettingsSheet,
  NotificationsHeader,
} from '@/components/notifications';
import { MembershipsState } from '@/components/organizations';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_TYPES } from '@/constants/notifications';
import { ThemeColors } from '@/constants/theme';
import { useGoBack } from '@/hooks/use-go-back';
import { useNow } from '@/hooks/use-now';
import type { AppNotification } from '@/schemas/notification.schema';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPreferences,
  useNotifications,
  useSaveNotificationPreferences,
} from '@/services/notifications';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { countByCategory, filterNotifications, groupNotifications } from '@/utils/notifications';

/**
 * Centro de notificaciones de la organización activa: «Todas / No leídas», categorías, la bandeja
 * agrupada por día y los ajustes (canales y modo de alerta). Igual para todos los roles.
 */
export const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const goBack = useGoBack('/inicio');
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { read, category, setRead, toggleCategory } = useNotificationsStore();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const preferences = useNotificationPreferences();
  const savePreferences = useSaveNotificationPreferences();

  const all = useMemo(() => notifications.data ?? [], [notifications.data]);
  const unread = all.filter((item) => !item.leida).length;
  // Los conteos de las categorías siguen al filtro de lectura elegido.
  const categoryCounts = useMemo(() => countByCategory(filterNotifications(all, read, null)), [all, read]);
  const sections = useMemo(
    () => groupNotifications(filterNotifications(all, read, category), now),
    [all, read, category, now],
  );

  const open = (notification: AppNotification) => {
    if (!notification.leida) markRead.mutate(notification.id);
  };

  const goTo = (notification: AppNotification) => {
    open(notification);
    const action = NOTIFICATION_TYPES[notification.tipo].action;
    if (action === 'TAREA' && notification.referenciaId) router.push(`/tarea/${notification.referenciaId}`);
    // Cada miembro ve su turno en Asistencia.
    if (action === 'TURNO') router.navigate('/asistencia');
  };

  const categoryLabel = NOTIFICATION_CATEGORIES.find((option) => option.value === category)?.label;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <NotificationsHeader
        onBack={() => goBack()}
        unread={unread}
        onMarkAllRead={() => markAllRead.mutate()}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {notifications.isPending ? (
        <MembershipsState status="loading" loadingText="Cargando tus notificaciones…" />
      ) : notifications.isError ? (
        <MembershipsState
          status="error"
          errorTitle="No pudimos cargar tus notificaciones"
          message={notifications.error.message}
          onRetry={() => notifications.refetch()}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          // Medidas en `style`: en la web el SectionList no recibe `contentContainerClassName`.
          contentContainerStyle={{
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom + 24, 40),
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={() => notifications.refetch()}
              tintColor={ThemeColors.primary}
              colors={[ThemeColors.primary]}
            />
          }
          ListHeaderComponent={
            <NotificationFilters
              read={read}
              readCounts={{ TODAS: all.length, NO_LEIDAS: unread }}
              onReadChange={setRead}
              category={category}
              categoryCounts={categoryCounts}
              onCategoryToggle={toggleCategory}
            />
          }
          renderSectionHeader={({ section }) => (
            <View accessibilityRole="header" className="flex-row items-center justify-between mt-6 mb-2">
              <Text className="text-xs font-bold tracking-wider text-primary">{section.title.toUpperCase()}</Text>
              <Text className="text-xs font-bold text-neutral-muted">
                {section.pending > 0
                  ? `${section.pending} ${section.pending === 1 ? 'pendiente' : 'pendientes'}`
                  : 'Leídas'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationCard notification={item} now={now} onPress={() => open(item)} onAction={() => goTo(item)} />
          )}
          ListEmptyComponent={
            <View className="mt-6">
              <MembershipsState
                status="empty"
                emptyIcon="notifications-off-outline"
                emptyTitle={all.length === 0 ? 'Aún no tienes notificaciones' : 'Nada por aquí'}
                emptyMessage={
                  all.length === 0
                    ? 'Aquí verás los cambios de turno, las tareas que te asignen y tus registros de asistencia.'
                    : `No tienes notificaciones${read === 'NO_LEIDAS' ? ' sin leer' : ''}${
                        categoryLabel ? ` de ${categoryLabel.toLowerCase()}` : ''
                      }.`
                }
              />
            </View>
          }
        />
      )}

      <NotificationSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences.data}
        saving={savePreferences.isPending}
        error={savePreferences.error?.message ?? null}
        onSave={(next) => savePreferences.mutate(next, { onSuccess: () => setSettingsOpen(false) })}
      />
    </SafeAreaView>
  );
};
