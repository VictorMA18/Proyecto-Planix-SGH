import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { EmployeeHome } from '@/schemas/home.schema';

import { SectionHeader } from '../shared';

interface MetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}

const Metric: React.FC<MetricProps> = ({ icon, label, children }) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="flex-1 bg-cardBg rounded-3xl p-4 shadow-sm shadow-primary/10"
  >
    <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center">
      <Ionicons name={icon} size={20} color={ThemeColors.primary} />
    </View>
    <Text numberOfLines={1} className="mt-3 text-xs font-bold text-neutral">
      {label}
    </Text>
    {children}
  </View>
);

interface WeeklyMetricsProps {
  semana: EmployeeHome['semana'];
  onSeeReport: () => void;
}

/** Horas, puntualidad y tareas completadas de la semana. */
export const WeeklyMetrics: React.FC<WeeklyMetricsProps> = ({ semana, onSeeReport }) => {
  const { horas, puntualidad, tareas } = semana;
  const hoursUp = horas.variacionPct >= 0;
  const punctuality =
    puntualidad >= 95
      ? { text: 'Óptimo', color: ThemeStatus.success, background: ThemeStatus.successBg }
      : puntualidad >= 90
        ? { text: 'Buena', color: ThemeStatus.info, background: ThemeStatus.infoBg }
        : { text: 'A mejorar', color: ThemeStatus.warningText, background: ThemeStatus.warningBg };
  const done = tareas.total > 0 ? Math.round((tareas.completadas / tareas.total) * 100) : 0;

  return (
    <View className="gap-4">
      <SectionHeader title="Métricas de la semana" action={{ label: 'Ver reporte', onPress: onSeeReport }} />

      <View className="flex-row gap-3">
        <Metric icon="timer-outline" label="Horas trab.">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">
            {horas.total.toFixed(1)}
            <Text className="text-base font-medium text-neutral-muted">h</Text>
          </Text>
          <StatusChip
            className="self-start mt-3"
            icon={hoursUp ? 'trending-up' : 'trending-down'}
            text={`${hoursUp ? '+' : '−'}${Math.abs(horas.variacionPct).toFixed(1)}%`}
            color={hoursUp ? ThemeStatus.success : ThemeStatus.warningText}
            background={hoursUp ? ThemeStatus.successBg : ThemeStatus.warningBg}
          />
        </Metric>

        <Metric icon="shield-checkmark-outline" label="Puntualidad">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">{Math.round(puntualidad)}%</Text>
          <StatusChip className="self-start mt-3" {...punctuality} />
        </Metric>

        <Metric icon="checkmark-circle-outline" label="Completadas">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">
            {tareas.completadas}
            <Text className="text-base font-medium text-neutral-muted">/{tareas.total}</Text>
          </Text>
          <StatusChip
            className="self-start mt-3"
            text={`${done}% listo`}
            color={ThemeColors.primary}
            background={ThemeColors.tertiary}
          />
        </Metric>
      </View>
    </View>
  );
};
