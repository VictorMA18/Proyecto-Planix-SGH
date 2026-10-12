import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform } from 'react-native';

import type { Attachment } from '@/schemas/task.schema';
import { useApiAuth } from '@/services/api-client';

// Android: permite a la app que abre el archivo leer el content:// que se le pasa.
const FLAG_GRANT_READ_URI_PERMISSION = 1;

const safeName = (name: string) => name.replace(/[\\/]/g, '_');

/**
 * Abrir y descargar un adjunto con su nombre y su tipo reales. El archivo se pide a la API
 * (`GET /tareas/{id}/adjuntos/{adjuntoId}/archivo`), que lo reenvía desde Cloudinary con su nombre
 * original. En el móvil se guarda en la caché de la app y se abre con el visor del sistema; en la
 * web se abre en una pestaña nueva o se descarga.
 */
export function useAttachmentActions(taskId: string) {
  const auth = useApiAuth();
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);
  const [error, setError] = useState('');

  const path = (attachment: Attachment, download: boolean) =>
    `/tareas/${taskId}/adjuntos/${attachment.id}/archivo${download ? '?descargar=true' : ''}`;

  /** Copia local con el nombre original (se reutiliza si ya se descargó). */
  const localFile = async (attachment: Attachment) => {
    const folder = new Directory(Paths.cache, 'adjuntos-descargados', attachment.id);
    folder.create({ intermediates: true, idempotent: true });
    const file = new File(folder, safeName(attachment.nombreArchivo));
    if (file.exists && file.size === attachment.tamanoBytes) return file;
    if (file.exists) file.delete();
    const { url, headers } = await auth(path(attachment, false));
    return File.downloadFileAsync(url, file, { headers });
  };

  const webBlob = async (attachment: Attachment, download: boolean) => {
    const { url, headers } = await auth(path(attachment, download));
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('No se pudo obtener el archivo.');
    return response.blob();
  };

  const run = async (kind: 'open' | 'download', action: () => Promise<void>) => {
    setError('');
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/No Activity found|ActivityNotFound/i.test(message)) {
        setError('No hay una app para abrir este archivo. Usa «Descargar» para guardarlo.');
      } else if (!/cancel/i.test(message)) {
        setError(message || 'No se pudo abrir el archivo.');
      }
    } finally {
      setBusy(null);
    }
  };

  /** Ver el archivo: visor de PDF o de imágenes del sistema (o una pestaña nueva en la web). */
  const open = (attachment: Attachment) =>
    run('open', async () => {
      if (Platform.OS === 'web') {
        // La pestaña se abre antes de esperar la descarga para que el navegador no la bloquee.
        const tab = window.open('', '_blank');
        const blob = await webBlob(attachment, false);
        const objectUrl = URL.createObjectURL(blob);
        if (tab) tab.location.href = objectUrl;
        else window.location.assign(objectUrl);
        return;
      }
      const file = await localFile(attachment);
      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: file.contentUri,
          type: attachment.mimeType,
          flags: FLAG_GRANT_READ_URI_PERMISSION,
        });
      } else {
        // iOS muestra la vista previa (Quick Look) con la opción de guardar o compartir.
        await Sharing.shareAsync(file.uri, {
          mimeType: attachment.mimeType,
          UTI: attachment.tipo === 'ARCHIVO' ? 'com.adobe.pdf' : 'public.image',
        });
      }
    });

  /** Guardar el archivo con su nombre original. */
  const download = (attachment: Attachment) =>
    run('download', async () => {
      if (Platform.OS === 'web') {
        const blob = await webBlob(attachment, true);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = attachment.nombreArchivo;
        link.click();
        return;
      }
      const file = await localFile(attachment);
      // La hoja del sistema permite guardarlo en Archivos, Descargas o Drive con su nombre.
      await Sharing.shareAsync(file.uri, {
        mimeType: attachment.mimeType,
        dialogTitle: `Guardar ${attachment.nombreArchivo}`,
        UTI: attachment.tipo === 'ARCHIVO' ? 'com.adobe.pdf' : 'public.image',
      });
    });

  return { open, download, busy, error, clearError: () => setError('') };
}
