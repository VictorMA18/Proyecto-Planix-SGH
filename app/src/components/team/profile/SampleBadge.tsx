import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface SampleBadgeProps {
  /** Sobre fondos oscuros (la tarjeta morada) se muestra en blanco translúcido. */
  onDark?: boolean;
}

/** Marca una sección cuyos datos son de ejemplo (aún no existe el backend que los provea). */
export const SampleBadge: React.FC<SampleBadgeProps> = ({ onDark = false }) => (
  <View
    accessible
    accessibilityLabel="Datos de ejemplo"
    style={{ borderCurve: 'continuous' }}
    className={`flex-row items-center rounded-full px-2.5 py-1 ${onDark ? 'bg-white/20' : 'bg-amber-100'}`}
  >
    <Ionicons name="flask-outline" size={12} color={onDark ? '#FFFFFF' : '#B45309'} />
    <Text className={`ml-1 text-[10px] font-bold ${onDark ? 'text-white' : 'text-amber-700'}`}>Ejemplo</Text>
  </View>
);
