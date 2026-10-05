import { Controller, Post, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('clerk')
  async handleClerkWebhook(@Req() req: Request, @Res() res: Response) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    const isDevelopmentSecret = !webhookSecret || webhookSecret === 'whsec_placeholder';

    if (isDevelopmentSecret) {
      this.logger.warn('CLERK_WEBHOOK_SECRET no está configurada o es un placeholder. Procesando webhook en modo desarrollo.');
    }

    const payload = JSON.stringify(req.body);
    const headers = req.headers as Record<string, string>;

    let evt: any = req.body;

    // Validación de firma Svix si existe una clave real whsec_...
    if (webhookSecret && !isDevelopmentSecret) {
      const svixId = headers['svix-id'];
      const svixTimestamp = headers['svix-timestamp'];
      const svixSignature = headers['svix-signature'];

      if (!svixId || !svixTimestamp || !svixSignature) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Faltan cabeceras Svix de verificación' });
      }
      const { Webhook } = await import('svix');
      const wh = new Webhook(webhookSecret);
      try {
        evt = wh.verify(payload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err: any) {
        this.logger.error(`Firma de Webhook no válida: ${err.message}`);
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Firma de webhook inválida' });
      }
    }

    const eventType = evt?.type || 'unknown';
    this.logger.log(`Recibido evento de Webhook Clerk: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        this.logger.log(`Usuario creado en Clerk: ${evt?.data?.id} (${evt?.data?.email_addresses?.[0]?.email_address})`);
        break;
      case 'user.updated':
        this.logger.log(`Usuario actualizado en Clerk: ${evt?.data?.id}`);
        break;
      case 'user.deleted':
        this.logger.log(`Usuario eliminado en Clerk: ${evt?.data?.id}`);
        break;
      default:
        this.logger.log(`Evento de Clerk procesado: ${eventType}`);
    }

    return res.status(HttpStatus.OK).json({ received: true, type: eventType });
  }
}
