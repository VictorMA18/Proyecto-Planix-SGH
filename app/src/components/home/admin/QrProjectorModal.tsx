import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import type { DynamicQr } from '@/schemas/home.schema';
import { formatCountdown } from '@/utils/format';

interface QrProjectorModalProps {
  visible: boolean;
  qr: DynamicQr;
  organizationName: string;
  onClose: () => void;
}

/** QR a pantalla completa para proyectarlo en la sede; se actualiza solo al rotar. */
export const QrProjectorModal: React.FC<QrProjectorModalProps> = ({ visible, qr, organizationName, onClose }) => {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 64, height - 320, 520);
  const remaining = new Date(qr.expiraEn).getTime() - now;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        className="flex-1 bg-white items-center justify-between px-8"
      >
        <View className="w-full flex-row items-center justify-between">
          <Text numberOfLines={1} className="flex-1 text-lg font-extrabold text-neutral">
            {organizationName}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar la proyección"
            onPress={onClose}
            className="w-11 h-11 rounded-full bg-tertiary items-center justify-center active:opacity-75"
          >
            <Ionicons name="close" size={22} color={ThemeColors.primary} />
          </Pressable>
        </View>

        <View className="items-center gap-6">
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-neutral text-center">
            Escanea para registrar tu asistencia
          </Text>
          <View accessible accessibilityLabel="Código QR de asistencia" className="p-4 bg-white rounded-3xl">
            <QRCode value={qr.token} size={Math.max(200, size)} ecl="M" quietZone={8} />
          </View>
          <View
            accessible
            accessibilityRole="timer"
            accessibilityLabel={`El código cambia en ${formatCountdown(remaining)}`}
            className="flex-row items-center bg-tertiary rounded-full px-5 py-2.5"
          >
            <Ionicons name="refresh-outline" size={18} color={ThemeColors.primary} />
            <Text style={{ fontVariant: ['tabular-nums'] }} className="ml-2 text-base font-bold text-primary">
              Cambia en {formatCountdown(remaining)}
            </Text>
          </View>
        </View>

        <Text className="text-sm text-neutral-muted text-center">
          Abre Planix › Asistencia › Escanear QR de entrada
        </Text>
      </View>
    </Modal>
  );
};
