import { Injectable } from '@nestjs/common';
import type { Prisma, PushToken, Usuario } from '@prisma/client';
import { WebPushService } from '../../../mensajeria/web-push.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ClaveWebResponseDto,
  PushTokenResponseDto,
} from '../dto/notificacion-response.dto';
import {
  QuitarPushTokenDto,
  RegistrarPushTokenDto,
} from '../dto/push-token.dto';

/** El `where` de Prisma para encontrar una suscripción web por su endpoint. */
const porEndpoint = (endpoint: string): Prisma.PushTokenWhereInput => ({
  webPushSuscripcion: { path: ['endpoint'], equals: endpoint },
});

/**
 * Dispositivos del usuario para el push. Un token (o endpoint web) es de un solo dispositivo: si
 * otra cuenta inicia sesión en él, pasa a esa cuenta y vuelve a quedar activo.
 */
@Injectable()
export class PushTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  async registrar(
    usuario: Usuario,
    dto: RegistrarPushTokenDto,
  ): Promise<PushTokenResponseDto> {
    const web = dto.plataforma === 'WEB';
    const suscripcion = web
      ? {
          endpoint: dto.webPushSubscription!.endpoint,
          keys: {
            p256dh: dto.webPushSubscription!.keys.p256dh,
            auth: dto.webPushSubscription!.keys.auth,
          },
        }
      : null;
    const existente = await this.prisma.pushToken.findFirst({
      where: web
        ? porEndpoint(suscripcion!.endpoint)
        : { expoPushToken: dto.expoPushToken },
    });
    const datos = {
      usuarioId: usuario.id,
      plataforma: dto.plataforma,
      expoPushToken: web ? null : dto.expoPushToken!,
      webPushSuscripcion: suscripcion ?? undefined,
      activo: true,
    };
    const token: PushToken = existente
      ? await this.prisma.pushToken.update({
          where: { id: existente.id },
          data: datos,
        })
      : await this.prisma.pushToken.create({ data: datos });
    return PushTokenResponseDto.desde(token);
  }

  async quitar(usuario: Usuario, dto: QuitarPushTokenDto): Promise<void> {
    await this.prisma.pushToken.updateMany({
      where: {
        usuarioId: usuario.id,
        ...(dto.expoPushToken
          ? { expoPushToken: dto.expoPushToken }
          : porEndpoint(dto.endpoint!)),
      },
      data: { activo: false },
    });
  }

  claveWeb(): ClaveWebResponseDto {
    return Object.assign(new ClaveWebResponseDto(), {
      clavePublica: this.webPush.clavePublica(),
    });
  }
}
