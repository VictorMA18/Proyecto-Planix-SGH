import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  COLA_PUSH,
  PATRON_DESPACHO_PUSH,
  type MensajePush,
} from './mensaje-push.interface';

/**
 * Publica en RabbitMQ los push por despachar (documentacion/06, flujo 9). `RABBITMQ_URL` se lee al
 * publicar: sin ella, o si la cola no responde, se registra y la acción que lo originó sigue igual
 * (la notificación ya quedó en la bandeja).
 */
@Injectable()
export class ColaPushService implements OnModuleDestroy {
  private readonly logger = new Logger(ColaPushService.name);
  private cliente: ClientRMQ | null = null;

  private conectar(): ClientRMQ | null {
    if (this.cliente) return this.cliente;
    const url = process.env.RABBITMQ_URL;
    if (!url) return null;
    this.cliente = new ClientRMQ({
      urls: [url],
      queue: COLA_PUSH,
      queueOptions: { durable: true },
    });
    return this.cliente;
  }

  async publicar(mensaje: MensajePush): Promise<void> {
    if (mensaje.usuarioIds.length === 0) return;
    const cliente = this.conectar();
    if (!cliente) {
      this.logger.warn('RABBITMQ_URL sin configurar: no se envía el push.');
      return;
    }
    try {
      await firstValueFrom(
        cliente.emit(PATRON_DESPACHO_PUSH, mensaje).pipe(timeout(5000)),
      );
    } catch (error) {
      this.logger.error(`No se pudo encolar el push: ${String(error)}`);
    }
  }

  async onModuleDestroy() {
    await this.cliente?.close();
  }
}
