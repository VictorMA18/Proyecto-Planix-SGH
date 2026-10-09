import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { EmployeeHome } from '@/schemas/home.schema';
import { formatClock24 } from '@/utils/format';

/** `Turno Mañana (08:00 - 17:00)`. */
export const ShiftChip: React.FC<{ turno: EmployeeHome['turno'] }> = ({ turno }) => (
  <View
    accessible
    style={{ borderCurve: 'continuous' }}
    className="self-start flex-row items-center bg-tertiary rounded-full px-4 py-2.5"
  >
    <Ionicons name="time-outline" size={16} color={ThemeColors.primary} />
    <Text className="ml-2 text-sm font-bold text-primary">
      Turno {turno.nombre} ({formatClock24(turno.inicio)} - {formatClock24(turno.fin)})
    </Text>
  </View>
);
