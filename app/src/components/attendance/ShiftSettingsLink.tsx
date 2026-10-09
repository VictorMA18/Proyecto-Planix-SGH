import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

/** Acceso a la configuración de turnos (solo ADMIN). */
export const ShiftSettingsLink: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Configuración de turnos, solo administradores. Plantillas, tolerancias y asignaciones"
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className="w-full min-h-16 flex-row items-center bg-tertiary rounded-2xl p-4 active:opacity-80"
  >
    <View className="w-11 h-11 rounded-xl bg-cardBg items-center justify-center mr-3">
      <Ionicons name="options-outline" size={22} color={ThemeColors.primary} />
    </View>
    <View className="flex-1">
      <View className="flex-row items-center gap-2">
        <Text numberOfLines={1} className="flex-shrink text-base font-extrabold text-neutral">
          Configuración de turnos
        </Text>
        <View className="bg-primary rounded-md px-2 py-0.5">
          <Text className="text-[10px] font-bold text-white">ADMIN</Text>
        </View>
      </View>
      <Text className="text-sm text-neutral-muted">Plantillas, tolerancias y asignaciones</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color={ThemeColors.primary} />
  </Pressable>
);
