import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { formatLongDate } from '@/utils/format';

interface HomeGreetingProps {
  firstName: string;
  /** Contenido bajo el saludo (p. ej. la etiqueta del turno). */
  children?: React.ReactNode;
}

/** Fecha de hoy y saludo con el nombre del usuario. */
export const HomeGreeting: React.FC<HomeGreetingProps> = ({ firstName, children }) => {
  const now = useNow(60_000);

  return (
    <View className="gap-2">
      <View className="flex-row items-center">
        <Ionicons name="calendar-outline" size={16} color={ThemeColors.primary} />
        <Text className="ml-2 text-sm font-bold text-neutral-muted">{formatLongDate(new Date(now))}</Text>
      </View>
      <Text accessibilityRole="header" className="text-3xl font-extrabold text-neutral">
        ¡Hola, {firstName}! 👋
      </Text>
      {children}
    </View>
  );
};
