import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ProgressBar, StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import type { EmployeeHome } from '@/schemas/home.schema';
import { liveWorkedMs } from '@/utils/attendance';
import { formatClock12, formatRemaining, splitDuration } from '@/utils/format';

const tabular = { fontVariant: ['tabular-nums' as const] };

/** Tiempo activo de hoy (tramos reales de la jornada), puntualidad de la entrada y progreso del turno. */
export const ActiveTimeCard: React.FC<{ home: EmployeeHome }> = ({ home }) => {
  const now = useNow();
  const { turno, estado, entrada } = home;
  const inShift = estado === 'DENTRO';
  const worked = liveWorkedMs(home.minutosTrabajados, estado, home.calculadoEn, now);
  const [hours, minutes, seconds] = splitDuration(worked);
  const progress = turno ? Math.min(100, (worked / (turno.objetivoMin * 60_000)) * 100) : 0;
  const remaining = turno ? new Date(turno.fin).getTime() - now : 0;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10 items-center"
    >
      {inShift ? (
        <StatusChip
          icon="checkmark-circle"
          text="DENTRO DE TURNO"
          color={ThemeStatus.success}
          background={ThemeStatus.successBg}
        />
      ) : entrada ? (
        <StatusChip
          icon="log-out-outline"
          text="SALIDA REGISTRADA"
          color={ThemeStatus.info}
          background={ThemeStatus.infoBg}
        />
      ) : (
        <StatusChip
          icon="time-outline"
          text="SIN ENTRADA"
          color={ThemeColors.mutedText}
          background={ThemeColors.tertiary}
        />
      )}

      <Text className="mt-6 text-xs font-bold tracking-widest text-neutral-muted">TIEMPO ACTIVO HOY</Text>

      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Tiempo activo hoy: ${Number(hours)} horas, ${Number(minutes)} minutos y ${Number(seconds)} segundos`}
        className="flex-row items-center mt-3"
      >
        <Text style={tabular} className="text-5xl font-extrabold text-neutral">
          {hours}
        </Text>
        <Text className="mx-1 text-4xl font-bold text-primary/40">:</Text>
        <Text style={tabular} className="text-5xl font-extrabold text-neutral">
          {minutes}
        </Text>
        <Text className="mx-1 text-4xl font-bold text-primary/40">:</Text>
        <Text style={tabular} className="text-5xl font-extrabold text-primary">
          {seconds}
        </Text>
      </View>

      {entrada ? (
        <View className="flex-row items-center mt-4">
          <Ionicons name="log-in-outline" size={18} color={ThemeColors.primary} />
          <Text className="ml-2 text-sm text-neutral-muted">
            Entrada: <Text className="font-bold text-neutral">{formatClock12(entrada.registradaEn)}</Text>
            {entrada.puntual === null
              ? ''
              : entrada.puntual
                ? ' (a tiempo)'
                : ` (+${entrada.minutosTarde} min)`}
          </Text>
        </View>
      ) : (
        <Text className="mt-4 text-sm text-neutral-muted text-center">
          Aún no registras tu entrada de hoy. Escanea el QR en la pestaña Asistencia.
        </Text>
      )}

      {turno ? (
        <View className="w-full mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-neutral">Progreso del turno ({Math.round(progress)}%)</Text>
            <Text className="text-sm font-bold text-primary">
              {remaining > 0 ? `Quedan ${formatRemaining(remaining)}` : 'Turno terminado'}
            </Text>
          </View>
          <ProgressBar className="mt-3" value={progress} color={ThemeColors.primary} />
        </View>
      ) : null}
    </View>
  );
};
