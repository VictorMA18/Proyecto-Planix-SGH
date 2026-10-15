import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MetricsPeriod } from '@/schemas/metrics.schema';
import { formatDelta, formatHoursShort } from '@/utils/metrics';

import { AnimatedBarChart } from './AnimatedBarChart';

interface PerformanceTrendCardProps {
  trend: MetricsPeriod['tendencia'];
  isTeam: boolean;
  animationKey: string;
}

/** Tendencia de horas: promedio por día, variación frente al periodo anterior y barras animadas. */
export const PerformanceTrendCard: React.FC<PerformanceTrendCardProps> = ({ trend, isTeam, animationKey }) => {
  const up = (trend.variacionPct ?? 0) >= 0;

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text accessibilityRole="header" className="text-sm font-bold text-neutral-muted">
            Tendencia de horas
          </Text>
          <View className="flex-row items-baseline gap-1.5 mt-1">
            <Text className="text-3xl font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
              {formatHoursShort(trend.promedioDiarioHoras)}
            </Text>
            <Text className="text-sm text-neutral-muted">promedio / día</Text>
          </View>
        </View>
        {trend.variacionPct !== null ? (
          <StatusChip
            icon={up ? 'trending-up' : 'trending-down'}
            text={`${formatDelta(trend.variacionPct)} vs. anterior`}
            color={up ? ThemeStatus.success : ThemeStatus.errorText}
            background={up ? ThemeStatus.successBg : ThemeStatus.errorBg}
          />
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-4 mb-4">
        <View className="flex-row items-center gap-1.5">
          <View style={{ width: 14, height: 2, backgroundColor: ThemeColors.mutedText }} />
          <Text className="text-xs text-neutral-muted">
            Meta: {trend.metaDiariaHoras > 0 ? `${formatHoursShort(trend.metaDiariaHoras)}/día` : 'sin turno'}
            {isTeam && trend.metaDiariaHoras > 0 ? ' por colaborador' : ''}
          </Text>
        </View>
        {trend.mejor ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="flash" size={12} color={ThemeColors.primary} />
            <Text className="text-xs font-bold text-primary">
              {trend.mejor.etiqueta}: {formatHoursShort(trend.mejor.horas)}
              {trend.mejor.variacionPct !== null ? ` (${formatDelta(trend.mejor.variacionPct)})` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <AnimatedBarChart bars={trend.barras} animationKey={animationKey} />
    </View>
  );
};
