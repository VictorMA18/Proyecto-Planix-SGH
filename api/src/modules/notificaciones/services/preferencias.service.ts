import { Injectable } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PreferenciasResponseDto } from '../dto/notificacion-response.dto';
import { PreferenciasNotificacionDto } from '../dto/preferencias-notificacion.dto';

/** Canales y modo de alerta del usuario (sin fila guardada se usan los valores por defecto). */
@Injectable()
export class PreferenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuario: Usuario): Promise<PreferenciasResponseDto> {
    return PreferenciasResponseDto.desde(
      await this.prisma.preferenciasNotificacion.findUnique({
        where: { usuarioId: usuario.id },
      }),
    );
  }

  async guardar(
    usuario: Usuario,
    dto: PreferenciasNotificacionDto,
  ): Promise<PreferenciasResponseDto> {
    const datos = {
      push: dto.push,
      recordatoriosFichaje: dto.recordatoriosFichaje,
      novedadesTareas: dto.novedadesTareas,
      modoAlerta: dto.modoAlerta,
    };
    return PreferenciasResponseDto.desde(
      await this.prisma.preferenciasNotificacion.upsert({
        where: { usuarioId: usuario.id },
        create: { usuarioId: usuario.id, ...datos },
        update: datos,
      }),
    );
  }
}
