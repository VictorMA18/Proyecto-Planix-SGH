import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DespachoPushService } from './despacho-push.service';
import {
  PATRON_DESPACHO_PUSH,
  type MensajePush,
} from './mensaje-push.interface';

/** Recibe de RabbitMQ los push encolados (solo si `main.ts` conectó el microservicio RMQ). */
@Controller()
export class DespachoPushController {
  private readonly logger = new Logger(DespachoPushController.name);

  constructor(private readonly despacho: DespachoPushService) {}

  @EventPattern(PATRON_DESPACHO_PUSH)
  async despachar(@Payload() mensaje: MensajePush): Promise<void> {
    try {
      await this.despacho.despachar(mensaje);
    } catch (error) {
      this.logger.error(`Falló el despacho de un push: ${String(error)}`);
    }
  }
}
