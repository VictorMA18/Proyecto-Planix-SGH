import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform } from 'react-native';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import type { PeriodType, ReportFormat } from '@/schemas/metrics.schema';
import { useApiAuth } from '@/services/api-client';

const MIME: Record<ReportFormat, string> = {
  PDF: 'application/pdf',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const UTI: Record<ReportFormat, string> = {
  PDF: 'com.adobe.pdf',
  XLSX: 'org.openxmlformats.spreadsheetml.sheet',
};

/** Nombre del archivo que manda la API en `Content-Disposition`. */
const fileNameFrom = (header: string | null, format: ReportFormat) =>
  header?.match(/filename="([^"]+)"/)?.[1] ?? `planix-reporte.${format === 'PDF' ? 'pdf' : 'xlsx'}`;

/**
 * Descarga el reporte del periodo (`GET /organizaciones/{id}/metricas/reporte`) que arma el backend.
 * En el móvil se guarda en la caché y se abre la hoja de compartir (desde la que también se guarda);
 * en la web se descarga con su nombre.
 */
export function useReportExport() {
  const auth = useApiAuth();
  const { organization } = useActiveOrganization();
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const [error, setError] = useState('');

  const exportReport = async (format: ReportFormat, type: PeriodType, date: string, memberId: string | null) => {
    if (!organization) return;
    setError('');
    setBusy(format);
    try {
      const params = new URLSearchParams({ formato: format, periodo: type, fecha: date });
      if (memberId) params.set('miembroId', memberId);
      const { url, headers } = await auth(`/organizaciones/${organization.id}/metricas/reporte?${params.toString()}`);

      if (Platform.OS === 'web') {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('No se pudo generar el reporte.');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(await response.blob());
        link.download = fileNameFrom(response.headers.get('Content-Disposition'), format);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
        return;
      }

      if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
      const folder = new Directory(Paths.cache, 'reportes');
      folder.create({ intermediates: true, idempotent: true });
      // Con una carpeta como destino, el archivo toma el nombre de `Content-Disposition`.
      const file = await File.downloadFileAsync(url, folder, { headers, idempotent: true });
      await Sharing.shareAsync(file.uri, {
        mimeType: MIME[format],
        UTI: UTI[format],
        dialogTitle: 'Guardar o compartir el reporte',
      });
    } catch (err) {
      // Cerrar la hoja de compartir sin elegir nada no es un error.
      const message = err instanceof Error ? err.message : '';
      if (!/cancel|abort/i.test(message)) setError('No se pudo generar el reporte. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  return { exportReport, busy, error, clearError: () => setError('') };
}
