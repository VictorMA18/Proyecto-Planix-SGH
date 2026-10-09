import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ProgressBar, StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import type { EmployeeHome } from '@/schemas/home.schema';
import { formatClock12, formatRemaining, splitDuration } from '@/utils/format';

const tabular = { fontVariant: ['tabular-nums' as const] };

interface ActiveTimeCardProps {
  turno: EmployeeHome['turno'];
  estado: EmployeeHome['estado'];
  entrada: EmployeeHome['entrada'];
}

/** Tiempo activo de hoy: cronómetro desde la hora de entrada, progreso y tiempo restante del turno. */
export const ActiveTimeCard: React.FC<ActiveTimeCardProps> = ({ turno, estado, entrada }) => {
  const now = useNow();
  const inShift = estado === 'DENTRO' && !!entrada;

  const start = new Date(turno.inicio).getTime();
  const end = new Date(turno.fin).getTime();
  const elapsed = inShift ? now - new Date(entrada.registradaEn).getTime() : 0;
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const [hours, minutes, seconds] = splitDuration(elapsed);

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
      ) : (
        <StatusChip
          icon="time-outline"
          text="FUERA DE TURNO"
          color={ThemeColors.mutedText}
          background={ThemeColors.tertiary}
        />
      )}

      <Text className="mt-6 text-xs font-bold tracking-widest text-neutral-muted">TIEMPO ACTIVO HOY</Text>

      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Tiempo activo hoy: ${hours} horas, ${minutes} minutos y ${seconds} segundos`}
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

      {inShift ? (
        <View className="flex-row items-center mt-4">
          <Ionicons name="log-in-outline" size={18} color={ThemeColors.primary} />
          <Text className="ml-2 text-sm text-neutral-muted">
            Hora de entrada: <Text className="font-bold text-neutral">{formatClock12(entrada.registradaEn)}</Text>{' '}
            {entrada.puntual ? '(A tiempo)' : `(+${entrada.minutosTarde} min)`}
          </Text>
        </View>
      ) : (
        <Text className="mt-4 text-sm text-neutral-muted">Aún no registras tu entrada de hoy.</Text>
      )}

      <View className="w-full mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-neutral">Progreso turno ({Math.round(progress)}%)</Text>
          <Text className="text-sm font-bold text-primary">Quedan {formatRemaining(end - now)}</Text>
        </View>
        <ProgressBar className="mt-3" value={progress} color={ThemeColors.primary} />
      </View>
    </View>
  );
};
