import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { ShiftToday } from '@/schemas/attendance.schema';
import { formatClock24 } from '@/utils/format';

/** `Turno Mañana (08:00 - 17:00)` o «Sin turno asignado hoy». */
export const ShiftChip: React.FC<{ turno: ShiftToday | null }> = ({ turno }) => (
  <View
    accessible
    style={{ borderCurve: 'continuous' }}
    className="self-start flex-row items-center bg-tertiary rounded-full px-4 py-2.5"
  >
    <Ionicons name="time-outline" size={16} color={ThemeColors.primary} />
    <Text className="ml-2 text-sm font-bold text-primary">
      {turno
        ? `${turno.nombre} (${formatClock24(turno.inicio)} - ${formatClock24(turno.fin)})`
        : 'Sin turno asignado hoy'}
    </Text>
  </View>
);
