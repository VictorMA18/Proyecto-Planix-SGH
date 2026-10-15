import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ui';
import { PERIOD_TYPES } from '@/constants/metrics';
import { ThemeColors } from '@/constants/theme';
import type { PeriodType } from '@/schemas/metrics.schema';

interface PeriodSheetProps {
  visible: boolean;
  onClose: () => void;
  type: PeriodType;
  label: string;
  canGoNext: boolean;
  onTypeChange: (type: PeriodType) => void;
  onShift: (delta: number) => void;
  onToday: () => void;
}

/**
 * Elegir semana o mes y moverse al periodo anterior o siguiente (nunca más allá del actual). La
 * hoja queda abierta mientras se navega; las métricas se actualizan detrás.
 */
export const PeriodSheet: React.FC<PeriodSheetProps> = ({
  visible,
  onClose,
  type,
  label,
  canGoNext,
  onTypeChange,
  onShift,
  onToday,
}) => {
  const arrow = (delta: -1 | 1) => {
    const disabled = delta === 1 && !canGoNext;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={delta === -1 ? 'Periodo anterior' : 'Periodo siguiente'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onShift(delta)}
        style={{ opacity: disabled ? 0.35 : 1 }}
        className="w-11 h-11 rounded-full bg-tertiary items-center justify-center active:opacity-70"
      >
        <Ionicons name={delta === -1 ? 'chevron-back' : 'chevron-forward'} size={20} color={ThemeColors.primary} />
      </Pressable>
    );
  };

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      header={
        <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
          Periodo
        </Text>
      }
    >
      <View className="gap-4 pb-2">
        <View accessibilityRole="tablist" style={{ borderCurve: 'continuous', borderRadius: 16 }} className="flex-row bg-tertiary p-1">
          {PERIOD_TYPES.map((option) => {
            const selected = option.value === type;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => onTypeChange(option.value)}
                className="flex-1 active:opacity-80"
              >
                {/* Fondo nunca transparente y `key` para remontar: así Android conserva el radio. */}
                <View
                  key={selected ? 'on' : 'off'}
                  style={{
                    borderCurve: 'continuous',
                    borderRadius: 12,
                    backgroundColor: selected ? ThemeColors.primary : ThemeColors.tertiary,
                  }}
                  className="min-h-11 items-center justify-center px-2"
                >
                  <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }} className="text-sm font-bold">
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center gap-3">
          {arrow(-1)}
          <Text
            accessibilityLiveRegion="polite"
            numberOfLines={1}
            className="flex-1 text-center text-base font-extrabold text-neutral"
          >
            {label}
          </Text>
          {arrow(1)}
        </View>

        {canGoNext ? (
          <Pressable
            accessibilityRole="button"
            onPress={onToday}
            className="min-h-11 items-center justify-center active:opacity-70"
          >
            <Text className="text-sm font-bold text-primary">Ir al periodo actual</Text>
          </Pressable>
        ) : null}
      </View>
    </ActionSheet>
  );
};
