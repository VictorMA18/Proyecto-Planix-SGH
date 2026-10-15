import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface OptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** Avatar, icono o punto a la izquierda. */
  leading?: React.ReactNode;
  /** Etiqueta corta junto al nombre (p. ej. «Tú»). */
  badge?: string;
}

/**
 * Opción de una lista de selección única (dentro de una hoja inferior). Las clases son fijas y el
 * fondo va en `style`, nunca transparente, con `key` para remontar: en Android, una vista que pasa
 * de transparente a un color pierde el redondeado.
 */
export const OptionRow: React.FC<OptionRowProps> = ({ label, description, selected, onPress, leading, badge }) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={[label, badge, description].filter(Boolean).join(', ')}
    onPress={onPress}
    className="active:opacity-80"
  >
    <View
      key={selected ? 'on' : 'off'}
      style={{
        borderCurve: 'continuous',
        borderRadius: 16,
        backgroundColor: selected ? ThemeColors.tertiary : ThemeColors.cardBg,
      }}
      className="min-h-14 flex-row items-center px-3"
    >
      {leading ? <View className="mr-3">{leading}</View> : null}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            style={{ color: selected ? ThemeColors.primary : ThemeColors.neutral }}
            className="flex-shrink text-base font-bold"
          >
            {label}
          </Text>
          {badge ? (
            <View style={{ backgroundColor: ThemeColors.primary }} className="rounded-full px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">{badge}</Text>
            </View>
          ) : null}
        </View>
        {description ? (
          <Text numberOfLines={1} className="text-xs text-neutral-muted">
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={ThemeColors.primary} /> : null}
    </View>
  </Pressable>
);
