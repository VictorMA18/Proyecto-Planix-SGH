import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { ThemeStatus } from '@/constants/theme';

/** Con la entrada abierta no hace falta cámara: solo la acción de registrar la salida. */
export const ExitCard: React.FC<{ isBusy: boolean; onExit: () => void }> = ({ isBusy, onExit }) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10 gap-4"
  >
    <View className="flex-row items-center gap-3">
      <View
        style={{ backgroundColor: ThemeStatus.successBg }}
        className="w-12 h-12 rounded-2xl items-center justify-center"
      >
        <Ionicons name="checkmark-circle" size={26} color={ThemeStatus.success} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-extrabold text-neutral">Tu entrada está registrada</Text>
        <Text className="text-sm text-neutral-muted">
          Al terminar o salir a una pausa, registra tu salida. Para volver, escanearás el QR de nuevo.
        </Text>
      </View>
    </View>
    <AppButton title="Registrar salida" variant="secondary" icon="log-out-outline" isLoading={isBusy} onPress={onExit} />
  </View>
);
