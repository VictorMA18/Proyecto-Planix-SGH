import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui';

const CORNER = 'absolute w-9 h-9 border-white';

interface QrScannerCardProps {
  isBusy: boolean;
  /** Se llama una sola vez con el contenido del QR leído. */
  onScan: (token: string) => void;
}

/** Visor con la cámara real para registrar la entrada o el retorno escaneando el QR de la sede. */
export const QrScannerCard: React.FC<QrScannerCardProps> = ({ isBusy, onScan }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const handled = useRef(false);

  const start = async () => {
    const granted = permission?.granted ? permission : await requestPermission();
    if (!granted.granted) return;
    handled.current = false;
    setScanning(true);
  };

  const stop = () => {
    setScanning(false);
    setTorch(false);
  };

  const handleScan = ({ data }: { data: string }) => {
    if (handled.current || !data) return;
    handled.current = true;
    stop();
    onScan(data);
  };

  const denied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View className="w-full gap-4">
      <View
        accessible={!scanning}
        accessibilityLabel="Visor del código QR de asistencia"
        style={{ borderCurve: 'continuous' }}
        className="w-full h-[26rem] rounded-3xl bg-[#2A2740] overflow-hidden"
      >
        {scanning ? (
          <CameraView
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
          />
        ) : null}

        <View className="flex-1 p-5 justify-between" pointerEvents="box-none">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-black/40 rounded-full px-3 py-2">
              <View className={`w-2 h-2 rounded-full mr-2 ${scanning ? 'bg-green-400' : 'bg-white/50'}`} />
              <Text className="text-xs font-bold tracking-widest text-white">
                {scanning ? 'CÁMARA ACTIVA' : 'CÁMARA APAGADA'}
              </Text>
            </View>

            {scanning && Platform.OS !== 'web' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={torch ? 'Apagar la linterna' : 'Encender la linterna'}
                accessibilityState={{ selected: torch }}
                onPress={() => setTorch((on) => !on)}
                className={`w-11 h-11 rounded-full items-center justify-center ${torch ? 'bg-white' : 'bg-black/40'}`}
              >
                <Ionicons name={torch ? 'flash' : 'flash-off'} size={20} color={torch ? '#14121F' : '#FFFFFF'} />
              </Pressable>
            ) : null}
          </View>

          <View className="self-center w-44 h-44 items-center justify-center">
            <View className={`${CORNER} top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl`} />
            <View className={`${CORNER} top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl`} />
            <View className={`${CORNER} bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl`} />
            <View className={`${CORNER} bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl`} />
            {!scanning ? <Ionicons name="qr-code-outline" size={64} color="rgba(255,255,255,0.45)" /> : null}
          </View>

          <Text className="text-center text-sm font-semibold text-white">
            {scanning
              ? 'Centra el código QR dentro del marco'
              : 'Apunta la cámara al código QR ubicado en el tótem de tu sede u oficina'}
          </Text>
        </View>
      </View>

      {denied ? (
        <View
          style={{ borderCurve: 'continuous' }}
          className="bg-amber-100 rounded-2xl p-4 gap-3"
          accessibilityRole="alert"
        >
          <Text className="text-sm text-amber-700">
            La cámara está bloqueada. Permite el acceso en los ajustes del dispositivo para escanear el código.
          </Text>
          {Platform.OS !== 'web' ? (
            <AppButton title="Abrir ajustes" variant="secondary" icon="settings-outline" onPress={() => Linking.openSettings()} />
          ) : null}
        </View>
      ) : null}

      {scanning ? (
        <AppButton title="Cancelar escaneo" variant="secondary" icon="close-outline" onPress={stop} />
      ) : (
        <AppButton
          title="Escanear QR de entrada"
          icon="qr-code-outline"
          isLoading={isBusy}
          disabled={isBusy || !!denied}
          onPress={start}
        />
      )}
    </View>
  );
};
