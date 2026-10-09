import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemeColors } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useQrExport } from '@/hooks/use-qr-export';
import type { DynamicQr } from '@/schemas/home.schema';
import { formatClock24, formatCountdown } from '@/utils/format';

import { QrProjectorModal } from './QrProjectorModal';

interface QrActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

const QrAction: React.FC<QrActionProps> = ({ icon, label, onPress, primary, disabled }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }}
    disabled={disabled}
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className={`flex-1 min-h-11 flex-row items-center justify-center rounded-full px-3 active:opacity-80 ${
      primary ? 'bg-white' : 'bg-white/20'
    } ${disabled ? 'opacity-60' : ''}`}
  >
    <Ionicons name={icon} size={18} color={primary ? ThemeColors.primary : '#FFFFFF'} />
    <Text className={`ml-1.5 text-sm font-bold ${primary ? 'text-primary' : 'text-white'}`}>{label}</Text>
  </Pressable>
);

interface AttendanceQrCardProps {
  qr: DynamicQr;
  organizationName: string;
  /** Se llama al vencer la ventana para pedir el código siguiente. */
  onExpired: () => void;
}

/** QR dinámico de asistencia: el código real, su cuenta atrás y las acciones para proyectarlo o compartirlo. */
export const AttendanceQrCard: React.FC<AttendanceQrCardProps> = ({ qr, organizationName, onExpired }) => {
  const now = useNow();
  const remaining = new Date(qr.expiraEn).getTime() - now;
  const exporter = useQrExport();
  const [projecting, setProjecting] = useState(false);

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
          accessibilityLabel={`Cambia en ${formatCountdown(remaining)}`}
          className="items-end"
        >
          <Text className="text-[11px] text-white/70">Cambia en</Text>
          <Text style={{ fontVariant: ['tabular-nums'] }} className="text-2xl font-extrabold text-white">
            {formatCountdown(remaining)}
          </Text>
        </View>
      </View>

      <Text accessibilityRole="header" className="mt-5 text-xl font-extrabold text-white">
        QR de asistencia
      </Text>
      <Text className="mt-1 text-sm text-white/80">
        Tu equipo lo escanea para registrar su entrada. Cambia cada {Math.round(qr.ventanaSeg / 60)} min.
      </Text>

      <View
        accessible
        accessibilityLabel="Código QR de asistencia vigente"
        style={{ borderCurve: 'continuous' }}
        className="self-center mt-5 p-3 bg-white rounded-2xl"
      >
        <QRCode
          value={qr.token}
          size={176}
          ecl="M"
          quietZone={12}
          getRef={(ref: unknown) => {
            exporter.svgRef.current = ref as typeof exporter.svgRef.current;
          }}
        />
      </View>

      <View className="flex-row gap-2 mt-5">
        <QrAction icon="expand-outline" label="Proyectar" primary onPress={() => setProjecting(true)} />
        <QrAction icon="share-social-outline" label="Compartir" disabled={exporter.busy} onPress={exporter.share} />
        <QrAction icon="download-outline" label="Descargar" disabled={exporter.busy} onPress={exporter.download} />
      </View>

      <Text className="mt-3 text-xs text-white/80 text-center">
        Una copia compartida o descargada vale hasta las {formatClock24(qr.expiraEn)}.
      </Text>
      {exporter.error ? (
        <Text accessibilityRole="alert" className="mt-2 text-xs font-bold text-white text-center">
          {exporter.error}
        </Text>
      ) : null}

      <QrProjectorModal
        visible={projecting}
        qr={qr}
        organizationName={organizationName}
        onClose={() => setProjecting(false)}
      />
    </View>
  );
};
