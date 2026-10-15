import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { UserAvatar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { getInitials } from '@/utils/format';

interface FilterChipProps {
  label: string;
  accessibilityLabel: string;
  leading: React.ReactNode;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, accessibilityLabel, leading, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    className="flex-shrink active:opacity-80"
  >
    <View
      style={{ borderCurve: 'continuous', borderRadius: 999, backgroundColor: ThemeColors.cardBg }}
      className="min-h-11 flex-row items-center gap-2 pl-2 pr-3 shadow-sm shadow-primary/10"
    >
      {leading}
      <Text numberOfLines={1} className="flex-shrink text-sm font-bold text-neutral">
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={ThemeColors.mutedText} />
    </View>
  </Pressable>
);

interface MetricsFilterChipsProps {
  periodLabel: string;
  onOpenPeriod: () => void;
  /** Solo ADMIN: a quién se mira (`null` = todo el equipo). */
  scope?: {
    label: string;
    avatar: { name: string; uri: string | null } | null;
    onPress: () => void;
  };
}

/** Chips del encabezado: el periodo y, para el ADMIN, el equipo o la persona elegida. */
export const MetricsFilterChips: React.FC<MetricsFilterChipsProps> = ({ periodLabel, onOpenPeriod, scope }) => (
  <View className="flex-row flex-wrap gap-2">
    <FilterChip
      label={periodLabel}
      accessibilityLabel={`Periodo: ${periodLabel}. Cambiar`}
      leading={
        <View className="w-7 h-7 rounded-full bg-tertiary items-center justify-center">
          <Ionicons name="calendar-outline" size={15} color={ThemeColors.primary} />
        </View>
      }
      onPress={onOpenPeriod}
    />
    {scope ? (
      <FilterChip
        label={scope.label}
        accessibilityLabel={`Viendo: ${scope.label}. Cambiar`}
        leading={
          scope.avatar ? (
            <UserAvatar size={28} initials={getInitials(scope.avatar.name)} uri={scope.avatar.uri ?? undefined} />
          ) : (
            <View className="w-7 h-7 rounded-full bg-tertiary items-center justify-center">
              <Ionicons name="people" size={15} color={ThemeColors.primary} />
            </View>
          )
        }
        onPress={scope.onPress}
      />
    ) : null}
  </View>
);
