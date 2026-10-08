import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MemberSample } from '@/schemas/team.schema';

import { SampleBadge } from './SampleBadge';

const percent = (done: number, total: number) => (total > 0 ? (done / total) * 100 : 0);

const ProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <View className="h-2 rounded-full bg-tertiary overflow-hidden mt-4">
    <View
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      className="h-full rounded-full"
    />
  </View>
);

const Chip: React.FC<{ text: string; color: string; background: string }> = ({ text, color, background }) => (
  <View
    style={{ backgroundColor: background, borderCurve: 'continuous' }}
    className="self-start rounded-full px-2.5 py-1 mt-3"
  >
    <Text style={{ color }} className="text-[11px] font-bold">
      {text}
    </Text>
  </View>
);

interface MetricCardProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, icon, children }) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10"
  >
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-sm font-semibold text-neutral-muted">{label}</Text>
      <Ionicons name={icon} size={18} color={ThemeColors.primary} />
    </View>
    {children}
  </View>
);

interface MemberMetricsProps {
  sample: MemberSample;
  organizationName: string;
}

/**
 * Métricas del mes (datos de ejemplo). La puntualidad ocupa todo el ancho y los turnos y tareas
 * van en dos columnas, con más aire que tres tarjetas apretadas en una fila.
 */
export const MemberMetrics: React.FC<MemberMetricsProps> = ({ sample, organizationName }) => {
  const punctuality =
    sample.puntualidad >= 98
      ? { label: 'Excelente', color: ThemeStatus.success, background: ThemeStatus.successBg }
      : sample.puntualidad >= 92
        ? { label: 'Buena', color: ThemeStatus.info, background: ThemeStatus.infoBg }
        : { label: 'A mejorar', color: ThemeStatus.warningText, background: ThemeStatus.warningBg };
  const shifts = percent(sample.turnos.completados, sample.turnos.total);
  const pendingTasks = sample.tareas.total - sample.tareas.completadas;

  return (
    <View className="gap-4">
      <View className="gap-3">
        <View className="flex-row items-center">
          <Ionicons name="trending-up-outline" size={20} color={ThemeColors.primary} />
          <Text accessibilityRole="header" className="flex-1 ml-2 text-lg font-extrabold text-neutral">
            Métricas en {organizationName}
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="bg-tertiary rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-primary">{sample.periodo}</Text>
          </View>
          <SampleBadge />
        </View>
      </View>

      <MetricCard label="Puntualidad" icon="timer-outline">
        <Text className="text-4xl font-extrabold text-neutral">{sample.puntualidad.toFixed(1)}%</Text>
        <Chip text={punctuality.label} color={punctuality.color} background={punctuality.background} />
        <ProgressBar value={sample.puntualidad} color={punctuality.color} />
      </MetricCard>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <MetricCard label="Turnos" icon="calendar-outline">
            <Text className="text-3xl font-extrabold text-neutral">
              {sample.turnos.completados}
              <Text className="text-base font-medium text-neutral-muted">/{sample.turnos.total}</Text>
            </Text>
            <Chip
              text={`${shifts.toFixed(1)}% de meta`}
              color={ThemeColors.primary}
              background={ThemeColors.tertiary}
            />
            <ProgressBar value={shifts} color={ThemeColors.primary} />
          </MetricCard>
        </View>

        <View className="flex-1">
          <MetricCard label="Tareas" icon="checkmark-circle-outline">
            <Text className="text-3xl font-extrabold text-neutral">
              {sample.tareas.completadas}
              <Text className="text-base font-medium text-neutral-muted">/{sample.tareas.total}</Text>
            </Text>
            <Chip
              text={pendingTasks === 0 ? 'Al día' : `${pendingTasks} ${pendingTasks === 1 ? 'pendiente' : 'pendientes'}`}
              color={pendingTasks === 0 ? ThemeStatus.success : ThemeStatus.warningText}
              background={pendingTasks === 0 ? ThemeStatus.successBg : ThemeStatus.warningBg}
            />
            <ProgressBar
              value={percent(sample.tareas.completadas, sample.tareas.total)}
              color={ThemeColors.primary}
            />
          </MetricCard>
        </View>
      </View>
    </View>
  );
};
