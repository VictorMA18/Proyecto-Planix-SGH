import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  /** Etiqueta junto al título (p. ej. «2 pendientes»). */
  badge?: string;
  /** Enlace a la derecha (p. ej. «Ver reporte»). */
  action?: { label: string; onPress: () => void };
  /** Texto fijo a la derecha, cuando no es un enlace (p. ej. «4 presentes»). */
  trailing?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, badge, action, trailing }) => (
  <View className="flex-row items-center justify-between gap-3">
    <View className="flex-1 flex-row flex-wrap items-center gap-2">
      <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral">
        {title}
      </Text>
      {badge ? (
        <View className="bg-tertiary rounded-full px-2.5 py-1">
          <Text className="text-[11px] font-bold text-primary">{badge}</Text>
        </View>
      ) : null}
    </View>

    {action ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={action.onPress}
        className="min-h-11 flex-row items-center active:opacity-70"
      >
        <Text className="text-sm font-bold text-primary mr-1">{action.label}</Text>
        <Ionicons name="arrow-forward" size={14} color={ThemeColors.primary} />
      </Pressable>
    ) : trailing ? (
      <Text className="text-xs font-bold text-neutral">{trailing}</Text>
    ) : null}
  </View>
);
