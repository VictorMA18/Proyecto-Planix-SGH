import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface ComingSoonProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

/** Pantalla provisional de una sección que se construirá en una fase posterior. */
export const ComingSoon: React.FC<ComingSoonProps> = ({ icon, title }) => (
  <View className="flex-1 items-center justify-center px-8">
    <View className="w-16 h-16 rounded-full bg-tertiary items-center justify-center mb-4">
      <Ionicons name={icon} size={28} color={ThemeColors.primary} />
    </View>
    <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral mb-1">
      {title}
    </Text>
    <Text className="text-sm text-neutral-muted text-center">
      Esta sección estará disponible próximamente.
    </Text>
  </View>
);
