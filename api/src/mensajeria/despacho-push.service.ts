import { Injectable, Logger } from '@nestjs/common';
import type { PushSubscription } from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushService } from './expo-push.service';
import type { EnvioPush, MensajePush } from './mensaje-push.interface';
import { WebPushService } from './web-push.service';

/**
 * Consumidor de la cola: envía el push a cada dispositivo activo de los destinatarios que tienen
 * el push encendido, con su modo de alerta, y desactiva los tokens que el proveedor da por muertos.
 */
@Injectable()
export class DespachoPushService {
  private readonly logger = new Logger(DespachoPushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expo: ExpoPushService,
    private readonly webPush: WebPushService,
  ) {}

  async despachar(mensaje: MensajePush): Promise<void> {
    const preferencias = await this.prisma.preferenciasNotificacion.findMany({
      where: { usuarioId: { in: mensaje.usuarioIds } },
    });
    const porUsuario = new Map(preferencias.map((p) => [p.usuarioId, p]));
    // Sin fila de preferencias, el push está encendido y con sonido.
    const conPush = mensaje.usuarioIds.filter(
      (id) => porUsuario.get(id)?.push ?? true,
    );
    if (conPush.length === 0) return;

    const tokens = await this.prisma.pushToken.findMany({
      where: { usuarioId: { in: conPush }, activo: true },
    });
    const envio = (usuarioId: string): EnvioPush => ({
      titulo: mensaje.titulo,
      contenido: mensaje.contenido,
      datos: mensaje.datos,
      modoAlerta: porUsuario.get(usuarioId)?.modoAlerta ?? 'SONIDO',
    });

    const invalidos: string[] = [];
    const enviados: string[] = [];

    const moviles = tokens.filter((t) => t.expoPushToken);
    const resultados = await this.expo.enviar(
      moviles.map((t) => ({
        token: t.expoPushToken!,
        envio: envio(t.usuarioId),
      })),
    );
    for (const resultado of resultados) {
      const token = moviles.find((t) => t.expoPushToken === resultado.token);
      if (!token) continue;
      (resultado.invalido ? invalidos : enviados).push(token.id);
    }

    for (const token of tokens.filter((t) => t.webPushSuscripcion)) {
      const { invalido } = await this.webPush.enviar(
        token.webPushSuscripcion as unknown as PushSubscription,
        envio(token.usuarioId),
      );
      (invalido ? invalidos : enviados).push(token.id);
    }

    if (invalidos.length > 0) {
      await this.prisma.pushToken.updateMany({
        where: { id: { in: invalidos } },
        data: { activo: false },
      });
      this.logger.log(`${invalidos.length} token(s) push desactivados.`);
    }
    if (enviados.length > 0) {
      await this.prisma.pushToken.updateMany({
        where: { id: { in: enviados } },
        data: { ultimaVezUsado: new Date() },
      });
    }
  }
}
