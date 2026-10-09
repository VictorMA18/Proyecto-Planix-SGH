import { createHmac, timingSafeEqual } from 'crypto';
import {
  QR_LONGITUD_FIRMA,
  QR_PREFIJO,
  QR_VENTANA_SEG,
} from '../../../common/constants/asistencia.constants';

// El QR que se muestra cambia cada `QR_VENTANA_SEG` segundos: es el id del QR del día, el número de
// ventana y una firma HMAC de esa ventana con el secreto del día. Una foto o una copia compartida
// deja de servir cuando termina su ventana.

const PATRON = new RegExp(
  `^${QR_PREFIJO}\\.([0-9a-f-]{36})\\.(\\d{1,12})\\.([0-9a-f]{${QR_LONGITUD_FIRMA}})$`,
  'i',
);

/** Número de ventana de un instante. */
export function ventanaDe(instante: Date): number {
  return Math.floor(instante.getTime() / (QR_VENTANA_SEG * 1000));
}

/** Fin de una ventana. */
export function finDeVentana(ventana: number): Date {
  return new Date((ventana + 1) * QR_VENTANA_SEG * 1000);
}

function firmar(secreto: string, codigoQrId: string, ventana: number): string {
  return createHmac('sha256', secreto)
    .update(`${codigoQrId}.${ventana}`)
    .digest('hex')
    .slice(0, QR_LONGITUD_FIRMA);
}

/** Texto del QR para una ventana. */
export function crearTokenQr(
  codigoQrId: string,
  secreto: string,
  ventana: number,
): string {
  return `${QR_PREFIJO}.${codigoQrId}.${ventana}.${firmar(secreto, codigoQrId, ventana)}`;
}

export interface TokenQrLeido {
  codigoQrId: string;
  ventana: number;
  firma: string;
}

/** Descompone el texto escaneado; `null` si no tiene el formato de un QR de Planix. */
export function leerTokenQr(token: string): TokenQrLeido | null {
  const partes = PATRON.exec(token.trim());
  if (!partes) return null;
  return {
    codigoQrId: partes[1].toLowerCase(),
    ventana: Number(partes[2]),
    firma: partes[3].toLowerCase(),
  };
}

/** Compara la firma en tiempo constante. */
export function firmaValida(secreto: string, leido: TokenQrLeido): boolean {
  const esperada = Buffer.from(
    firmar(secreto, leido.codigoQrId, leido.ventana),
  );
  const recibida = Buffer.from(leido.firma);
  return (
    esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
  );
}
