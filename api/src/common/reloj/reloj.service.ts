import { Injectable } from '@nestjs/common';

/**
 * Hora actual del servidor. Toda regla que dependa de «ahora» (QR vigente, jornada de hoy,
 * puntualidad) la pide aquí, para que los tests puedan fijar la hora reemplazando este servicio.
 */
@Injectable()
export class RelojService {
  ahora(): Date {
    return new Date();
  }
}
