import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { ShiftsConfig } from '@/schemas/attendance.schema';

interface StatProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  caption: string;
}

const Stat: React.FC<StatProps> = ({ icon, label, value, unit, caption }) => (
  <View
    accessible
    accessibilityLabel={`${label}: ${value}${unit ?? ''} ${caption}`}
    style={{ borderCurve: 'continuous' }}
    className="flex-1 bg-cardBg rounded-2xl p-3 shadow-sm shadow-primary/10"
  >
    <View className="flex-row items-center justify-between">
      <Text numberOfLines={1} className="flex-1 text-xs text-neutral-muted">
        {label}
      </Text>
      <Ionicons name={icon} size={16} color={ThemeColors.primary} />
    </View>
    <Text className="mt-2 text-2xl font-extrabold text-neutral">
      {value}
      {unit ? <Text className="text-base text-primary">{unit}</Text> : null}
    </Text>
    <Text numberOfLines={1} className="text-xs text-neutral-muted">
      {caption}
    </Text>
  </View>
);

interface ShiftSummaryProps {
  resumen: ShiftsConfig['resumen'];
  onEditTolerance: () => void;
}

/** Plantillas activas, personal cubierto y tolerancia de entrada (tocarla permite cambiarla). */
export const ShiftSummary: React.FC<ShiftSummaryProps> = ({ resumen, onEditTolerance }) => (
  <View className="flex-row gap-3">
    <Stat icon="albums-outline" label="Plantillas" value={String(resumen.activas)} caption="Activas" />
    <Stat icon="people-outline" label="Personal" value={String(resumen.cubiertos)} caption="Con turno" />
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tolerancia de entrada: ${resumen.toleranciaMin} minutos. Toca para cambiarla`}
      onPress={onEditTolerance}
      className="flex-1 active:opacity-80"
    >
      <Stat icon="create-outline" label="Tolerancia" value={String(resumen.toleranciaMin)} unit="m" caption="Editar" />
    </Pressable>
  </View>
);
