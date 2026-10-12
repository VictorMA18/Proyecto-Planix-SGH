import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/constants/theme';

interface NotificationsHeaderProps {
  onBack: () => void;
  unread: number;
  onMarkAllRead: () => void;
  onOpenSettings: () => void;
}

/** Cabecera: volver, título, «Marcar leídas» (solo si hay pendientes) y ajustes. */
export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  onBack,
  unread,
  onMarkAllRead,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const canMark = unread > 0;

  return (
    <View
      style={{ paddingTop: Math.max(insets.top + 8, 16) }}
      className="w-full max-w-[480px] self-center flex-row items-center px-5 pb-3"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        hitSlop={4}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="w-11 h-11 rounded-full bg-tertiary items-center justify-center"
      >
        <Ionicons name="arrow-back" size={20} color={ThemeColors.neutral} />
      </Pressable>

      <Text accessibilityRole="header" numberOfLines={1} className="flex-1 ml-3 text-2xl font-extrabold text-neutral">
        Notificaciones
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={canMark ? `Marcar ${unread} como leídas` : 'No hay notificaciones pendientes'}
        accessibilityState={{ disabled: !canMark }}
        disabled={!canMark}
        onPress={onMarkAllRead}
        style={{ borderCurve: 'continuous', ...(canMark ? null : { opacity: 0.45 }) }}
        className="min-h-11 flex-row items-center rounded-full bg-tertiary px-3 active:opacity-75"
      >
        <Ionicons name="checkmark-done" size={16} color={ThemeColors.primary} />
        <Text className="ml-1.5 text-xs font-bold text-primary">Marcar leídas</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajustes de notificaciones"
        onPress={onOpenSettings}
        style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
        className="ml-2 w-11 h-11 rounded-xl bg-tertiary items-center justify-center"
      >
        <Ionicons name="options-outline" size={20} color={ThemeColors.neutral} />
      </Pressable>
    </View>
  );
};
