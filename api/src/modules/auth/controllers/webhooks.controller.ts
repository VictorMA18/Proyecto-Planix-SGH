import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { DatosUsuarioClerk } from '../../usuarios/interfaces/datos-usuario-clerk.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';

/** Evento de usuario enviado por Clerk (`user.created`, `user.updated`, `user.deleted`). */
interface ClerkWebhookEvent {
  type: string;
  data: DatosUsuarioClerk;
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly usuarios: UsuariosService) {}

  @Post('clerk')
  @HttpCode(200)
  async handleClerkWebhook(@Req() req: RawBodyRequest<Request>) {
    const evt = await this.verificar(req);
    this.logger.log(`Evento de Clerk recibido: ${evt.type}`);

    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await this.usuarios.sincronizar(evt.data);
        break;
      case 'user.deleted':
        if (evt.data.id) await this.usuarios.desactivar(evt.data.id);
        break;
      default:
        this.logger.debug(`Evento ignorado: ${evt.type}`);
    }

    return { received: true, type: evt.type };
  }

  /** Valida la firma Svix sobre el cuerpo crudo; sin secreto real solo se acepta en desarrollo. */
  private async verificar(
    req: RawBodyRequest<Request>,
  ): Promise<ClerkWebhookEvent> {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const esPlaceholder = !secret || secret === 'whsec_placeholder';

    if (esPlaceholder) {
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'Webhook de Clerk sin secreto configurado',
        );
      }
      this.logger.warn(
        'CLERK_WEBHOOK_SECRET no configurada: se omite la verificación de firma.',
      );
      return req.body as ClerkWebhookEvent;
    }

    const headers = req.headers as Record<string, string>;
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];
    if (!svixId || !svixTimestamp || !svixSignature || !req.rawBody) {
      throw new BadRequestException('Faltan cabeceras Svix de verificación');
    }

    // Import diferido: svix solo se carga como ESM y no hace falta fuera de este endpoint.
    const { Webhook } = await import('svix');
    const cuerpo = req.rawBody.toString('utf8');
    try {
      // En svix 2.x `verify` solo valida la firma (no devuelve el payload).
      new Webhook(secret).verify(cuerpo, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
      return JSON.parse(cuerpo) as ClerkWebhookEvent;
    } catch (err: unknown) {
      this.logger.error(
        `Firma de webhook no válida: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException('Firma de webhook inválida');
    }
  }
}
