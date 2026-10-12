import { TIPOS_ADJUNTO } from '../../../common/constants/tareas.constants';

// Firma de los primeros bytes de cada formato permitido: no basta con el `mimetype` que declara el
// cliente, que se puede falsificar.
const FIRMAS: { mime: string; coincide: (b: Buffer) => boolean }[] = [
  {
    mime: 'application/pdf',
    coincide: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  },
  {
    mime: 'image/png',
    coincide: (b) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/jpeg',
    coincide: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/gif',
    coincide: (b) =>
      ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')),
  },
  {
    mime: 'image/webp',
    coincide: (b) =>
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

/**
 * Tipo real de un archivo permitido según su contenido, o `null` si no es PDF ni imagen admitida.
 * Devuelve también si se guarda como IMAGEN o ARCHIVO.
 */
export function detectarTipoArchivo(
  buffer: Buffer,
): { mime: string; tipo: 'IMAGEN' | 'ARCHIVO' } | null {
  const firma = FIRMAS.find((f) => f.coincide(buffer));
  return firma ? { mime: firma.mime, tipo: TIPOS_ADJUNTO[firma.mime] } : null;
}
