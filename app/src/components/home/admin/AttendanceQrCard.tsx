import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { formatCountdown } from '@/utils/format';

interface AttendanceQrCardProps {
  /** Cuándo vence el código vigente (ISO). */
  expiresAt: string;
  onProject: () => void;
  /** Se llama al llegar a cero para pedir el código siguiente. */
  onExpired: () => void;
}

/** Código QR dinámico de asistencia: cuenta atrás de validez y acceso para proyectarlo. */
export const AttendanceQrCard: React.FC<AttendanceQrCardProps> = ({ expiresAt, onProject, onExpired }) => {
  const now = useNow();
  const remaining = new Date(expiresAt).getTime() - now;

  useEffect(() => {
    if (remaining <= 0) onExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-primary rounded-3xl p-6 shadow-lg shadow-primary/30"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-center bg-white/20 rounded-full px-3 py-1.5">
          <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
          <Text className="ml-1.5 text-[11px] font-bold tracking-wider text-white">CÓDIGO DINÁMICO</Text>
        </View>

        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`Válido por ${formatCountdown(remaining)}`}
          className="items-end"
        >
          <Text className="text-[11px] text-white/70">Válido por</Text>
          <Text style={{ fontVariant: ['tabular-nums'] }} className="text-2xl font-extrabold text-white">
            {formatCountdown(remaining)}
          </Text>
        </View>
      </View>

      <Text accessibilityRole="header" className="mt-5 text-xl font-extrabold text-white">
        QR de Asistencia Diario
      </Text>

      <View className="flex-row flex-wrap items-end justify-between gap-4 mt-2">
        <Text className="flex-1 min-w-[160px] text-sm text-white/80">
          Permite a tu equipo registrar entrada y salida presencial al instante.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Proyectar el código QR"
          onPress={onProject}
          style={{ borderCurve: 'continuous' }}
          className="min-h-11 flex-row items-center bg-white rounded-full px-5 active:opacity-80"
        >
          <Ionicons name="eye-outline" size={18} color={ThemeColors.primary} />
          <Text className="ml-2 text-sm font-bold text-primary">Proyectar</Text>
        </Pressable>
      </View>
    </View>
  );
};
