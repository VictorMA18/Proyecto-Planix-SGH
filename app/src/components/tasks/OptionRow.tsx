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
}

/** Opción de una lista de selección única (dentro de una hoja inferior). */
export const OptionRow: React.FC<OptionRowProps> = ({ label, description, selected, onPress, leading }) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={description ? `${label}, ${description}` : label}
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className={`min-h-14 flex-row items-center rounded-2xl px-3 active:bg-tertiary ${selected ? 'bg-tertiary' : ''}`}
  >
    {leading ? <View className="mr-3">{leading}</View> : null}
    <View className="flex-1">
      <Text numberOfLines={1} className={`text-base ${selected ? 'font-extrabold text-primary' : 'font-semibold text-neutral'}`}>
        {label}
      </Text>
      {description ? (
        <Text numberOfLines={1} className="text-xs text-neutral-muted">
          {description}
        </Text>
      ) : null}
    </View>
    {selected ? <Ionicons name="checkmark-circle" size={22} color={ThemeColors.primary} /> : null}
  </Pressable>
);
