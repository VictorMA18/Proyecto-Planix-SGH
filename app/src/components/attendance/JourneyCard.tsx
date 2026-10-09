import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { Journey } from '@/schemas/attendance.schema';
import { formatDayLabel, formatMinutes } from '@/utils/attendance';
import { formatClock12 } from '@/utils/format';

/** Una jornada del historial: fecha, horas, entrada, salida y puntualidad. */
export const JourneyCard: React.FC<{ journey: Journey }> = ({ journey }) => {
  const pauses = journey.movimientos.filter((m, i, all) => m.tipo === 'SALIDA' && i < all.length - 1).length;
  const open = journey.estadoActual === 'DENTRO';
  const day = formatDayLabel(journey.fecha);
  const exit = open ? 'en curso' : journey.horaFin ? formatClock12(journey.horaFin) : '—';

  return (
    <View
      accessible
      accessibilityLabel={`${day}. ${formatMinutes(journey.minutosTrabajados)} trabajadas. Entrada ${formatClock12(
        journey.horaInicio,
      )}, salida ${exit}.${journey.puntual === false ? ` ${journey.minutosTarde} minutos tarde.` : ''}`}
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10 gap-3"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-extrabold text-neutral capitalize">{day}</Text>
        {journey.puntual === true ? (
          <StatusChip icon="checkmark-circle" text="Puntual" color={ThemeStatus.success} background={ThemeStatus.successBg} />
        ) : journey.puntual === false ? (
          <StatusChip
            icon="time-outline"
            text={`+${journey.minutosTarde} min`}
            color={ThemeStatus.warningText}
            background={ThemeStatus.warningBg}
          />
        ) : (
          <StatusChip text="Sin turno" color={ThemeColors.mutedText} background={ThemeColors.tertiary} />
        )}
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View>
          <Text className="text-3xl font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
            {formatMinutes(journey.minutosTrabajados)}
          </Text>
          <Text className="text-xs text-neutral-muted">
            {journey.turno?.nombre ?? 'Sin turno'}
            {pauses > 0 ? ` · ${pauses} ${pauses === 1 ? 'pausa' : 'pausas'}` : ''}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View className="flex-row items-center">
            <Ionicons name="log-in-outline" size={16} color={ThemeColors.primary} />
            <Text className="ml-1.5 text-sm font-bold text-neutral">{formatClock12(journey.horaInicio)}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={16} color={open ? ThemeStatus.success : ThemeColors.mutedText} />
            <Text className={`ml-1.5 text-sm font-bold ${open ? 'text-green-700' : 'text-neutral'}`}>{exit}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
