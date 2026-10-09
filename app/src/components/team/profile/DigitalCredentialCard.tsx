import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MemberSample } from '@/schemas/team.schema';

import { SampleBadge } from '@/components/ui';

/** Credencial digital activa con la jornada de hoy y el registro de entrada (datos de ejemplo). */
export const DigitalCredentialCard: React.FC<{ sample: MemberSample }> = ({ sample }) => (
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
        <Text className="text-xs font-bold text-white">{sample.turno}</Text>
      </View>
      <SampleBadge onDark />
    </View>

    <View style={{ borderCurve: 'continuous' }} className="bg-white rounded-2xl p-5 mt-5 gap-4">
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={22} color={ThemeColors.primary} />
        <View className="ml-3 flex-1">
          <Text className="text-xs text-neutral-muted">Jornada de hoy</Text>
          <Text className="text-lg font-extrabold text-neutral">
            {sample.jornada.inicio} – {sample.jornada.fin}
          </Text>
        </View>
      </View>

      <View className="h-px bg-borderBg" />

      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="text-xs text-neutral-muted">Registro de entrada</Text>
        <View
          style={{ backgroundColor: ThemeStatus.successBg, borderCurve: 'continuous' }}
          className="flex-row items-center rounded-full px-3 py-1.5"
        >
          <Ionicons name="checkmark-circle" size={14} color={ThemeStatus.success} />
          <Text style={{ color: ThemeStatus.success }} className="ml-1.5 text-xs font-bold">
            {sample.registroEntrada}
          </Text>
        </View>
      </View>
    </View>
  </View>
);
