import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import type { MetricsPeriod } from '@/schemas/metrics.schema';
import { formatHoursShort, formatPercent } from '@/utils/metrics';

interface HoursProgressCardProps {
  hours: MetricsPeriod['horas'];
  isTeam: boolean;
}

/** Horas trabajadas frente a las planificadas del periodo, con la barra de avance. */
export const HoursProgressCard: React.FC<HoursProgressCardProps> = ({ hours, isTeam }) => (
  <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10">
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-full bg-tertiary items-center justify-center">
        <Ionicons name="time" size={20} color={ThemeColors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-neutral">{isTeam ? 'Horas totales del equipo' : 'Tus horas del periodo'}</Text>
        <Text className="text-xs text-neutral-muted">
          {hours.planificadas > 0 ? `Meta del periodo: ${formatHoursShort(hours.planificadas)}` : 'Sin turno asignado'}
        </Text>
      </View>
      {hours.cumplimientoPct !== null ? (
        <View style={{ borderCurve: 'continuous' }} className="bg-tertiary rounded-full px-2.5 py-1">
          <Text className="text-xs font-bold text-primary">{formatPercent(hours.cumplimientoPct)}</Text>
        </View>
      ) : null}
    </View>

    <View className="flex-row items-baseline gap-1.5 mt-4">
      <Text className="text-3xl font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
        {formatHoursShort(hours.trabajadas)}
      </Text>
      {hours.planificadas > 0 ? (
        <Text className="text-sm text-neutral-muted">/ {formatHoursShort(hours.planificadas)} planificadas</Text>
      ) : null}
    </View>
    {hours.planificadas > 0 ? (
      <>
        <ProgressBar className="mt-3" value={hours.cumplimientoPct ?? 0} color={ThemeColors.primary} />
        <Text className="mt-2 self-end text-xs font-bold text-neutral-muted">
          {hours.restantes > 0 ? `${formatHoursShort(hours.restantes)} restantes` : 'Meta del periodo cumplida'}
        </Text>
      </>
    ) : null}
  </View>
);
