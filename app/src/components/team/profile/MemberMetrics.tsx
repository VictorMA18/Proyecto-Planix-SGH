import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MemberSummary } from '@/schemas/team.schema';

import { ProgressBar, StatusChip } from '@/components/ui';

const percent = (done: number, total: number) => (total > 0 ? (done / total) * 100 : 0);

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
  summary: MemberSummary;
  organizationName: string;
}

/** `2026-10` → «Octubre 2026». */
function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(' de ', ' ');
}

/**
 * Métricas del mes en curso, calculadas en el backend. La puntualidad ocupa todo el ancho y las
 * horas y tareas van en dos columnas, con más aire que tres tarjetas apretadas en una fila.
 */
export const MemberMetrics: React.FC<MemberMetricsProps> = ({ summary, organizationName }) => {
  const rate = summary.puntualidad;
  const punctuality =
    rate === null
      ? { label: 'Sin jornadas con turno', color: ThemeColors.mutedText, background: '#F1F0F5' }
      : rate >= 98
        ? { label: 'Excelente', color: ThemeStatus.success, background: ThemeStatus.successBg }
        : rate >= 92
          ? { label: 'Buena', color: ThemeStatus.info, background: ThemeStatus.infoBg }
          : { label: 'A mejorar', color: ThemeStatus.warningText, background: ThemeStatus.warningBg };
  const hours = summary.horas;
  const weekGain = hours.variacionSemana >= 0;
  const pendingTasks = summary.tareas.total - summary.tareas.completadas;

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
            <Text className="text-xs font-bold text-primary">{formatPeriod(summary.periodo)}</Text>
          </View>
        </View>
      </View>

      <MetricCard label="Puntualidad" icon="timer-outline">
        <Text className="text-4xl font-extrabold text-neutral">{rate === null ? '—' : `${rate.toFixed(1)}%`}</Text>
        <StatusChip className="self-start mt-3" text={punctuality.label} color={punctuality.color} background={punctuality.background} />
        <ProgressBar className="mt-4" value={rate ?? 0} color={punctuality.color} />
      </MetricCard>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <MetricCard label="Horas" icon="time-outline">
            <Text className="text-3xl font-extrabold text-neutral">
              {hours.trabajadas.toFixed(1)}
              <Text className="text-base font-medium text-neutral-muted">h</Text>
            </Text>
            <Text className="text-xs text-neutral-muted">
              {hours.meta > 0 ? `de ${hours.meta.toFixed(0)} h del turno` : 'Sin turno asignado'}
            </Text>
            <StatusChip
              className="self-start mt-3"
              text={`${weekGain ? '+' : '−'}${Math.abs(hours.variacionSemana).toFixed(1)}h semana`}
              color={weekGain ? ThemeStatus.success : ThemeStatus.warningText}
              background={weekGain ? ThemeStatus.successBg : ThemeStatus.warningBg}
            />
            <ProgressBar className="mt-4" value={percent(hours.trabajadas, hours.meta)} color={ThemeColors.primary} />
          </MetricCard>
        </View>

        <View className="flex-1">
          <MetricCard label="Tareas" icon="checkmark-circle-outline">
            <Text className="text-3xl font-extrabold text-neutral">
              {summary.tareas.completadas}
              <Text className="text-base font-medium text-neutral-muted">/{summary.tareas.total}</Text>
            </Text>
            <StatusChip
              className="self-start mt-3"
              text={pendingTasks === 0 ? 'Al día' : `${pendingTasks} ${pendingTasks === 1 ? 'pendiente' : 'pendientes'}`}
              color={pendingTasks === 0 ? ThemeStatus.success : ThemeStatus.warningText}
              background={pendingTasks === 0 ? ThemeStatus.successBg : ThemeStatus.warningBg}
            />
            <ProgressBar
              className="mt-4"
              value={percent(summary.tareas.completadas, summary.tareas.total)}
              color={ThemeColors.primary}
            />
          </MetricCard>
        </View>
      </View>
    </View>
  );
};
