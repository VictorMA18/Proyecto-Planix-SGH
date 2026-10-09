import React from 'react';
import { Text, View } from 'react-native';

import { ProgressBar, StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import type { AttendanceToday } from '@/schemas/attendance.schema';
import { workedMs } from '@/utils/attendance';

const tabular = { fontVariant: ['tabular-nums' as const] };

const pad = (value: number) => String(value).padStart(2, '0');

function splitHm(ms: number): [string, string] {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  return [pad(Math.floor(minutes / 60)), pad(minutes % 60)];
}

/** Tiempo acumulado hoy frente al objetivo del turno, con el estado actual de la jornada. */
export const AccumulatedTimeCard: React.FC<{ today: AttendanceToday }> = ({ today }) => {
  const now = useNow(1000);
  const estado = today.jornada?.estadoActual;
  const worked = workedMs(today.jornada?.movimientos ?? [], now);
  const goal = today.turno.objetivoMin * 60_000;
  const progress = Math.min(100, (worked / goal) * 100);
  const [hours, minutes] = splitHm(worked);
  const [goalHours, goalMinutes] = splitHm(goal);

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10"
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-xs font-bold tracking-widest text-neutral-muted">TIEMPO ACUMULADO HOY</Text>
        {estado === 'DENTRO' ? (
          <StatusChip icon="checkmark-circle" text="EN TURNO" color={ThemeStatus.success} background={ThemeStatus.successBg} />
        ) : estado === 'FUERA' ? (
          <StatusChip icon="log-out-outline" text="SALIDA REGISTRADA" color={ThemeStatus.info} background={ThemeStatus.infoBg} />
        ) : (
          <StatusChip icon="time-outline" text="SIN ENTRADA" color={ThemeColors.mutedText} background={ThemeColors.tertiary} />
        )}
      </View>

      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Tiempo acumulado hoy: ${Number(hours)} horas y ${Number(minutes)} minutos de ${Number(goalHours)} horas`}
        className="flex-row items-baseline flex-wrap mt-3"
      >
        <Text style={tabular} className="text-5xl font-extrabold text-neutral">
          {hours}h {minutes}m
        </Text>
        <Text style={tabular} className="ml-2 text-base font-semibold text-neutral-muted">
          / {goalHours}h {goalMinutes}m
        </Text>
      </View>

      <Text className="mt-2 text-sm text-neutral-muted">{today.turno.nombre}</Text>

      <ProgressBar className="mt-4" value={progress} color={ThemeColors.primary} />
      <Text className="mt-2 text-xs font-bold text-primary">{Math.round(progress)}% de la jornada</Text>
    </View>
  );
};
