import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { AdminHome } from '@/schemas/home.schema';

const Legend: React.FC<{ color: string; label: string; value: number }> = ({ color, label, value }) => (
  <View className="flex-row items-center">
    <View style={{ backgroundColor: color }} className="w-2.5 h-2.5 rounded-full mr-2" />
    <Text className="text-xs text-neutral-muted">
      {label}: <Text className="font-bold text-neutral">{value}</Text>
    </Text>
  </View>
);

/** Miembros presentes ahora frente a los esperados, y cómo se distribuye la asistencia. */
export const PresenceCard: React.FC<{ presencia: AdminHome['presencia'] }> = ({ presencia }) => {
  const { presentes, esperados, puntuales, retrasos, pendientes } = presencia;
  const percent = esperados > 0 ? (presentes / esperados) * 100 : 0;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center mr-3">
            <Ionicons name="people-outline" size={20} color={ThemeColors.primary} />
          </View>
          <Text className="flex-1 text-[11px] font-bold tracking-wider text-neutral-muted">
            PRESENCIA DE HOY
          </Text>
        </View>
        <StatusChip
          text={`${percent.toFixed(1)}% presente`}
          color={ThemeColors.primary}
          background={ThemeColors.tertiary}
        />
      </View>

      <Text className="mt-4 text-4xl font-extrabold text-neutral">
        {presentes}
        <Text className="text-base font-medium text-neutral-muted"> / {esperados} con turno hoy</Text>
      </Text>

      <View className="flex-row items-center justify-between mt-5">
        <Text className="text-xs font-bold text-neutral">Distribución de asistencia</Text>
        <Text className="text-xs font-bold text-primary">{presentes} dentro ahora</Text>
      </View>

      <View className="flex-row h-2.5 rounded-full overflow-hidden bg-tertiary mt-3">
        {puntuales > 0 ? <View style={{ flex: puntuales, backgroundColor: ThemeColors.primary }} /> : null}
        {retrasos > 0 ? <View style={{ flex: retrasos, backgroundColor: ThemeStatus.warning }} /> : null}
        {pendientes > 0 ? <View style={{ flex: pendientes, backgroundColor: '#D4CCEF' }} /> : null}
      </View>

      <View className="flex-row flex-wrap gap-x-5 gap-y-2 mt-4">
        <Legend color={ThemeColors.primary} label="Puntuales" value={puntuales} />
        <Legend color={ThemeStatus.warning} label="Retrasos" value={retrasos} />
        <Legend color="#D4CCEF" label="Pendientes" value={pendientes} />
      </View>
    </View>
  );
};
