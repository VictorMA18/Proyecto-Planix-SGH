import { Injectable, Logger } from '@nestjs/common';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { opcionesAlerta } from './alerta.util';
import type { EnvioPush } from './mensaje-push.interface';

/** Resultado por token: `invalido` si Expo dice que el dispositivo ya no está registrado. */
export interface ResultadoExpo {
  token: string;
  invalido: boolean;
}

/**
 * Envío a Android e iOS por Expo Push Service. `EXPO_ACCESS_TOKEN` es opcional (solo si se activa
 * la seguridad mejorada en Expo) y se lee al enviar.
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async enviar(
    envios: { token: string; envio: EnvioPush }[],
  ): Promise<ResultadoExpo[]> {
    const validos = envios.filter(({ token }) => Expo.isExpoPushToken(token));
    const resultados: ResultadoExpo[] = envios
      .filter(({ token }) => !Expo.isExpoPushToken(token))
      .map(({ token }) => ({ token, invalido: true }));
    if (validos.length === 0) return resultados;

    const expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
    });
    const mensajes: ExpoPushMessage[] = validos.map(({ token, envio }) => {
      const alerta = opcionesAlerta(envio.modoAlerta);
      return {
        to: token,
        title: envio.titulo,
        body: envio.contenido ?? undefined,
        data: { ...envio.datos },
        sound: alerta.sonido,
        priority: alerta.prioridad,
        channelId: alerta.canalAndroid,
      };
    });

    let indice = 0;
    for (const lote of expo.chunkPushNotifications(mensajes)) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(lote);
        tickets.forEach((ticket, i) => {
          const token = validos[indice + i].token;
          const invalido =
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered';
          if (ticket.status === 'error' && !invalido) {
            this.logger.warn(`Expo rechazó un push: ${ticket.message}`);
          }
          resultados.push({ token, invalido });
        });
      } catch (error) {
        this.logger.error(`No se pudo enviar un lote a Expo: ${String(error)}`);
      }
      indice += lote.length;
    }
    return resultados;
  }
}
