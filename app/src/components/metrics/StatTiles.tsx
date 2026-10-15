import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { PUNCTUALITY_LEVEL } from '@/constants/metrics';
import { ThemeColors } from '@/constants/theme';
import type { MetricsPeriod } from '@/schemas/metrics.schema';
import { formatHoursShort, formatPercent } from '@/utils/metrics';

interface StatTileProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  children?: React.ReactNode;
}

const StatTile: React.FC<StatTileProps> = ({ label, icon, value, children }) => (
  <View
    accessible
    accessibilityLabel={`${label}: ${value}`}
    style={{ borderCurve: 'continuous' }}
    className="flex-1 bg-cardBg rounded-3xl p-4 shadow-sm shadow-primary/10"
  >
    <View className="flex-row items-center justify-between gap-2">
      <Text numberOfLines={1} className="flex-1 text-[11px] font-bold tracking-wider text-neutral-muted">
        {label.toUpperCase()}
      </Text>
      <Ionicons name={icon} size={18} color={ThemeColors.primary} />
    </View>
    <Text className="mt-2 text-2xl font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
      {value}
    </Text>
    <View className="mt-2 flex-row flex-wrap items-center gap-1.5">{children}</View>
  </View>
);

interface StatTilesProps {
  punctuality: MetricsPeriod['puntualidad'];
  overtime: MetricsPeriod['horasExtra'];
}

/** Índice de puntualidad y horas extra, uno al lado del otro. */
export const StatTiles: React.FC<StatTilesProps> = ({ punctuality, overtime }) => {
  const level = punctuality.nivel ? PUNCTUALITY_LEVEL[punctuality.nivel] : null;

  return (
    <View className="flex-row gap-3">
      <StatTile label="Puntualidad" icon="checkmark-done-circle-outline" value={formatPercent(punctuality.porcentaje)}>
        {punctuality.evaluadas > 0 ? (
          <Text className="text-xs text-neutral-muted">
            {punctuality.aTiempo}/{punctuality.evaluadas} a tiempo
          </Text>
        ) : (
          <Text className="text-xs text-neutral-muted">Sin entradas con turno</Text>
        )}
        {level ? <StatusChip text={level.label} color={level.color} background={level.background} /> : null}
      </StatTile>
      <StatTile label="Horas extra" icon="flash-outline" value={formatHoursShort(overtime.total)}>
        {overtime.hoy > 0 ? (
          <StatusChip
            text={`+${formatHoursShort(overtime.hoy)} hoy`}
            color={ThemeColors.primary}
            background={ThemeColors.tertiary}
          />
        ) : (
          <Text className="text-xs text-neutral-muted">Sobre la duración del turno</Text>
        )}
      </StatTile>
    </View>
  );
};
