import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusChipProps {
  text: string;
  color: string;
  background: string;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

/** Etiqueta pequeña de estado (Óptimo, Alta, Puntual…). */
export const StatusChip: React.FC<StatusChipProps> = ({ text, color, background, icon, className = '' }) => (
  <View
    style={{ backgroundColor: background, borderCurve: 'continuous' }}
    className={`flex-row items-center rounded-full px-2.5 py-1 ${className}`}
  >
    {icon ? <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} /> : null}
    <Text style={{ color }} className="text-[11px] font-bold">
      {text}
    </Text>
  </View>
);
