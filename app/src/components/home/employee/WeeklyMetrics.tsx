import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { SampleBadge, StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { EmployeeHome, HomeTasks } from '@/schemas/home.schema';

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
  /** Tareas de ejemplo hasta la Fase 3. */
  tareas: HomeTasks['semana'] | undefined;
  onSeeHistory: () => void;
}

/** Horas y puntualidad reales de la semana, más el avance de tareas (ejemplo). */
export const WeeklyMetrics: React.FC<WeeklyMetricsProps> = ({ semana, tareas, onSeeHistory }) => {
  const hours = semana.minutosTrabajados / 60;
  const change = semana.variacionPct;
  const up = (change ?? 0) >= 0;
  const punctuality =
    semana.puntualidad === null
      ? null
      : semana.puntualidad >= 95
        ? { text: 'Óptimo', color: ThemeStatus.success, background: ThemeStatus.successBg }
        : semana.puntualidad >= 90
          ? { text: 'Buena', color: ThemeStatus.info, background: ThemeStatus.infoBg }
          : { text: 'A mejorar', color: ThemeStatus.warningText, background: ThemeStatus.warningBg };
  const done = tareas && tareas.total > 0 ? Math.round((tareas.completadas / tareas.total) * 100) : 0;

  return (
    <View className="gap-4">
      <SectionHeader title="Métricas de la semana" action={{ label: 'Ver historial', onPress: onSeeHistory }} />

      <View className="flex-row gap-3">
        <Metric icon="timer-outline" label="Horas trab.">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">
            {hours.toFixed(1)}
            <Text className="text-base font-medium text-neutral-muted">h</Text>
          </Text>
          {change === null ? (
            <Text className="mt-3 text-[11px] text-neutral-muted">{semana.diasTrabajados} días</Text>
          ) : (
            <StatusChip
              className="self-start mt-3"
              icon={up ? 'trending-up' : 'trending-down'}
              text={`${up ? '+' : '−'}${Math.abs(change).toFixed(1)}%`}
              color={up ? ThemeStatus.success : ThemeStatus.warningText}
              background={up ? ThemeStatus.successBg : ThemeStatus.warningBg}
            />
          )}
        </Metric>

        <Metric icon="shield-checkmark-outline" label="Puntualidad">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">
            {semana.puntualidad === null ? '—' : `${Math.round(semana.puntualidad)}%`}
          </Text>
          {punctuality ? (
            <StatusChip className="self-start mt-3" {...punctuality} />
          ) : (
            <Text className="mt-3 text-[11px] text-neutral-muted">Sin turno</Text>
          )}
        </Metric>

        <Metric icon="checkmark-circle-outline" label="Completadas">
          <Text className="mt-1 text-2xl font-extrabold text-neutral">
            {tareas?.completadas ?? '—'}
            <Text className="text-base font-medium text-neutral-muted">/{tareas?.total ?? '—'}</Text>
          </Text>
          <View className="flex-row flex-wrap items-center gap-1 mt-3">
            <StatusChip text={`${done}%`} color={ThemeColors.primary} background={ThemeColors.tertiary} />
            <SampleBadge />
          </View>
        </Metric>
      </View>
    </View>
  );
};
