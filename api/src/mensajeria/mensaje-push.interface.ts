import type { ModoAlerta, TipoNotificacion } from '@prisma/client';

/** Cola de RabbitMQ y patrón del evento de despacho de push (documentacion/06, flujo 9). */
export const COLA_PUSH = 'push_despacho';
export const PATRON_DESPACHO_PUSH = 'push.despachar';

/** Lo que la app necesita para abrir la pantalla correcta al tocar la notificación. */
export interface DatosPush {
  tipo: TipoNotificacion;
  notificacionId: string;
  organizacionId: string | null;
  referenciaId: string | null;
  /** Ruta de la app: `/tarea/{id}`, `/mi-turno` o `/notificaciones`. */
  url: string;
}

/** Mensaje que se encola tras crear una notificación: a quién y qué mostrar. */
export interface MensajePush {
  usuarioIds: string[];
  titulo: string;
  contenido: string | null;
  datos: DatosPush;
}

/** Un envío ya resuelto para un dispositivo, con el modo de alerta de su dueño. */
export interface EnvioPush {
  titulo: string;
  contenido: string | null;
  datos: DatosPush;
  modoAlerta: ModoAlerta;
}
