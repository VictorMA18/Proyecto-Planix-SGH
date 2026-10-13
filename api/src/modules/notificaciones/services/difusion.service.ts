import { BadRequestException, Injectable } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { ROLES_DIFUSION } from '../../../common/constants/notificaciones.constants';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { DifusionDto } from '../dto/difusion.dto';
import { DifusionResponseDto } from '../dto/notificacion-response.dto';
import { NotificacionesService } from './notificaciones.service';

/**
 * Avisos de ADMIN o SUPERVISOR (documentacion/06, flujo 8): a todos los miembros activos o a los
 * elegidos. Quien lo envía también lo recibe, para tenerlo en su bandeja.
 */
@Injectable()
export class DifusionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async difundir(
    usuario: Usuario,
    organizacionId: string,
    dto: DifusionDto,
  ): Promise<DifusionResponseDto> {
    await this.acceso.exigirRol(
      usuario.id,
      organizacionId,
      ROLES_DIFUSION,
      'Solo un ADMIN o un SUPERVISOR puede difundir avisos.',
    );

    const miembros = await this.prisma.miembroOrganizacion.findMany({
      where: {
        organizacionId,
        estado: 'ACTIVO',
        ...(dto.miembroIds ? { id: { in: dto.miembroIds } } : {}),
      },
      select: { usuarioId: true },
    });
    if (dto.miembroIds && miembros.length !== dto.miembroIds.length) {
      throw new BadRequestException(
        'Algunos destinatarios no son miembros activos de la organización.',
      );
    }

    const notificados = await this.notificaciones.notificar({
      organizacionId,
      tipo: 'AVISO',
      titulo: dto.titulo,
      contenido: dto.contenido,
      actorId: usuario.id,
      incluirActor: true,
      usuarioIds: [...miembros.map((m) => m.usuarioId), usuario.id],
    });
    return Object.assign(new DifusionResponseDto(), {
      notificacionesCreadas: notificados.length,
    });
  }
}
