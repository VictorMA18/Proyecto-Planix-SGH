import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Usuario } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  INCLUDE_BANDEJA,
  LeerTodasResponseDto,
  NotificacionResponseDto,
} from '../dto/notificacion-response.dto';
import { NotificacionesQueryDto } from '../dto/notificaciones-query.dto';

/** Bandeja del usuario autenticado: solo ve y marca sus propias notificaciones. */
@Injectable()
export class BandejaService {
  constructor(private readonly prisma: PrismaService) {}

  private filtro(
    usuarioId: string,
    organizacionId: string | undefined,
  ): Prisma.NotificacionUsuarioWhereInput {
    return {
      usuarioId,
      ...(organizacionId ? { notificacion: { organizacionId } } : {}),
    };
  }

  async listar(
    usuario: Usuario,
    { organizacionId, leida, page, pageSize }: NotificacionesQueryDto,
  ): Promise<NotificacionResponseDto[]> {
    const filas = await this.prisma.notificacionUsuario.findMany({
      where: {
        ...this.filtro(usuario.id, organizacionId),
        ...(leida === undefined ? {} : { leida }),
      },
      include: INCLUDE_BANDEJA,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return filas.map((fila) => NotificacionResponseDto.desde(fila));
  }

  async leer(
    usuario: Usuario,
    notificacionId: string,
  ): Promise<NotificacionResponseDto> {
    const fila = await this.prisma.notificacionUsuario.findFirst({
      where: { id: notificacionId, usuarioId: usuario.id },
    });
    if (!fila) throw new NotFoundException('La notificación no existe.');
    const actualizada = await this.prisma.notificacionUsuario.update({
      where: { id: fila.id },
      data: fila.leida ? {} : { leida: true, leidaEn: new Date() },
      include: INCLUDE_BANDEJA,
    });
    return NotificacionResponseDto.desde(actualizada);
  }

  async leerTodas(
    usuario: Usuario,
    organizacionId: string | undefined,
  ): Promise<LeerTodasResponseDto> {
    const { count } = await this.prisma.notificacionUsuario.updateMany({
      where: { ...this.filtro(usuario.id, organizacionId), leida: false },
      data: { leida: true, leidaEn: new Date() },
    });
    return Object.assign(new LeerTodasResponseDto(), { actualizadas: count });
  }
}
