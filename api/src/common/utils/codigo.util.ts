import { randomInt } from 'crypto';
import {
  ALFABETO_CODIGO,
  LONGITUD_CODIGO,
} from '../constants/invitaciones.constants';

/** Código aleatorio de 10 caracteres para invitaciones. */
export function generarCodigo(): string {
  return Array.from(
    { length: LONGITUD_CODIGO },
    () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)],
  ).join('');
}

/** Los códigos se escriben a mano: se aceptan en minúsculas y con espacios. */
export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}
