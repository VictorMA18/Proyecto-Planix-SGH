import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MemberSummary } from '@/schemas/team.schema';
import { formatShiftTime } from '@/utils/attendance';
import { formatClock12 } from '@/utils/format';

/** Credencial digital: el turno asignado y el registro de entrada de hoy. */
export const DigitalCredentialCard: React.FC<{ summary: MemberSummary }> = ({ summary }) => {
  const entered = !!summary.entradaHoy;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-primary rounded-3xl p-6 shadow-lg shadow-primary/30"
    >
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center mr-3">
          <Ionicons name="id-card-outline" size={22} color="#FFFFFF" />
        </View>
        <Text accessibilityRole="header" className="flex-1 text-lg font-extrabold text-white">
          Credencial digital activa
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-2 mt-4">
        <View className="bg-white/20 rounded-full px-3 py-1.5">
          <Text className="text-xs font-bold text-white">{summary.turno?.nombre ?? 'Sin turno asignado'}</Text>
        </View>
      </View>

      <View style={{ borderCurve: 'continuous' }} className="bg-white rounded-2xl p-5 mt-5 gap-4">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={22} color={ThemeColors.primary} />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-neutral-muted">Horario del turno</Text>
            <Text className="text-lg font-extrabold text-neutral">
              {summary.turno
                ? `${formatShiftTime(summary.turno.horaInicio)} – ${formatShiftTime(summary.turno.horaFin)}`
                : 'Sin horario'}
            </Text>
          </View>
        </View>

        <View className="h-px bg-borderBg" />

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-xs text-neutral-muted">Registro de entrada de hoy</Text>
          <View
            style={{
              backgroundColor: entered ? ThemeStatus.successBg : '#F1F0F5',
              borderCurve: 'continuous',
            }}
            className="flex-row items-center rounded-full px-3 py-1.5"
          >
            <Ionicons
              name={entered ? 'checkmark-circle' : 'remove-circle-outline'}
              size={14}
              color={entered ? ThemeStatus.success : ThemeColors.mutedText}
            />
            <Text
              style={{ color: entered ? ThemeStatus.success : ThemeColors.mutedText }}
              className="ml-1.5 text-xs font-bold"
            >
              {summary.entradaHoy ? formatClock12(summary.entradaHoy) : 'Sin registro'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
