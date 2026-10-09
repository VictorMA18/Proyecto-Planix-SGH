import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

/** Lo que expone el `Svg` de react-native-qrcode-svg (vía `getRef`). */
interface SvgWithDataUrl {
  toDataURL: (callback: (base64: string) => void) => void;
}

const FILE_NAME = 'planix-qr-asistencia.png';

/**
 * Exporta el QR dibujado como PNG para compartirlo o descargarlo. En el móvil se abre la hoja de
 * compartir del sistema (desde la que también se puede guardar); en la web se descarga el archivo.
 */
export function useQrExport() {
  const svgRef = useRef<SvgWithDataUrl | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toBase64 = () =>
    new Promise<string>((resolve, reject) => {
      const svg = svgRef.current;
      if (!svg?.toDataURL) {
        reject(new Error('El código QR aún no está listo.'));
        return;
      }
      svg.toDataURL((data) => resolve(data.replace(/^data:image\/png;base64,/, '')));
    });

  const downloadOnWeb = (base64: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = FILE_NAME;
    link.click();
  };

  const run = useCallback(async (mode: 'share' | 'download') => {
    setError('');
    setBusy(true);
    try {
      const base64 = await toBase64();

      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        if (mode === 'share' && nav.share) {
          const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
          const file = new window.File([blob], FILE_NAME, { type: 'image/png' });
          if (nav.canShare?.({ files: [file] })) {
            await nav.share({ files: [file], title: 'QR de asistencia' });
            return;
          }
        }
        downloadOnWeb(base64);
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Este dispositivo no permite compartir archivos.');
      }
      const file = new File(Paths.cache, FILE_NAME);
      if (file.exists) file.delete();
      file.create();
      file.write(base64, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: mode === 'share' ? 'Compartir QR de asistencia' : 'Guardar QR de asistencia',
      });
    } catch (err) {
      // Cerrar la hoja de compartir sin elegir nada no es un error.
      const message = err instanceof Error ? err.message : '';
      if (!/cancel|abort/i.test(message)) setError(message || 'No se pudo exportar el código QR.');
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    svgRef,
    busy,
    error,
    share: () => run('share'),
    download: () => run('download'),
  };
}
