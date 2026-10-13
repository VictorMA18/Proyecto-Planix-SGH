import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import webpush, { type PushSubscription } from 'web-push';
import { opcionesAlerta } from './alerta.util';
import type { EnvioPush } from './mensaje-push.interface';

/**
 * Envío a navegadores por Web Push (VAPID). Las claves viven solo en el entorno del backend
 * (documentacion/10) y se leen al usarse: sin ellas la API arranca y el push web se omite.
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private configurado = false;

  private configurar(): boolean {
    if (this.configurado) return true;
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    this.configurado = true;
    return true;
  }

  /** Clave pública que necesita el navegador para suscribirse (503 si no está configurada). */
  clavePublica(): string {
    if (!this.configurar()) {
      throw new ServiceUnavailableException(
        'Las notificaciones web no están disponibles: falta configurar VAPID en el servidor.',
      );
    }
    return process.env.VAPID_PUBLIC_KEY!;
  }

  /** `invalido` si el navegador anuló la suscripción (404/410); `false` si se envió o falló por otra causa. */
  async enviar(
    suscripcion: PushSubscription,
    envio: EnvioPush,
  ): Promise<{ invalido: boolean }> {
    if (!this.configurar()) {
      this.logger.warn('Web Push sin configurar: se omite el envío.');
      return { invalido: false };
    }
    const alerta = opcionesAlerta(envio.modoAlerta);
    try {
      await webpush.sendNotification(
        suscripcion,
        JSON.stringify({
          titulo: envio.titulo,
          contenido: envio.contenido,
          datos: envio.datos,
          silenciosa: alerta.silenciosaWeb,
          vibrar: alerta.vibrarWeb,
        }),
      );
      return { invalido: false };
    } catch (error) {
      const estado = (error as { statusCode?: number }).statusCode;
      if (estado === 404 || estado === 410) return { invalido: true };
      this.logger.warn(`Web Push falló (${estado ?? 'sin estado'}).`);
      return { invalido: false };
    }
  }
}
