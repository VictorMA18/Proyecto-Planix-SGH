import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

/** Etiqueta con icono de un campo del formulario de tarea, y su error si lo hay. */
export const FieldLabel: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({ icon, text }) => (
  <View className="flex-row items-center mb-2">
    <Ionicons name={icon} size={15} color={ThemeColors.primary} />
    <Text className="ml-1.5 text-xs font-semibold text-neutral">{text}</Text>
  </View>
);

export const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <Text accessibilityRole="alert" className="mt-1.5 ml-1 text-xs font-medium text-red-600">
      {message}
    </Text>
  ) : null;
