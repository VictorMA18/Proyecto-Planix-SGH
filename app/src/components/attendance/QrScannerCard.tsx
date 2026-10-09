import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { QrScannerCardProps } from './CameraScanner';

/**
 * `expo-camera` necesita su módulo nativo. Se carga aquí y no al inicio de la app: si el módulo no
 * está en el binario (Expo Go o development build desactualizados), solo falla este visor y no todas
 * las rutas, que Expo Router carga al arrancar.
 */
function loadScanner(): React.FC<QrScannerCardProps> | null {
  try {
    return (require('./CameraScanner') as typeof import('./CameraScanner')).CameraScanner;
  } catch {
    return null;
  }
}

export const QrScannerCard: React.FC<QrScannerCardProps> = (props) => {
  const Scanner = useMemo(loadScanner, []);
  if (Scanner) return <Scanner {...props} />;

  return (
    <View
      accessibilityRole="alert"
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-amber-100 rounded-3xl p-6 items-center gap-3"
    >
      <Ionicons name="videocam-off-outline" size={32} color="#B45309" />
      <Text className="text-base font-extrabold text-amber-700 text-center">La cámara no está disponible</Text>
      <Text className="text-sm text-amber-700 text-center">
        Esta versión de la app no incluye el módulo de cámara. Reconstruye el development build o actualiza Expo Go.
      </Text>
    </View>
  );
};
