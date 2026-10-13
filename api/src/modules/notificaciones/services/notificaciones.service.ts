import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, TipoNotificacion } from '@prisma/client';
import { ColaPushService } from '../../../mensajeria/cola-push.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { rutaDeNotificacion } from '../utils/mensajes.util';

/** Preferencia que puede excluir a un destinatario de un tipo de aviso. */
export type FiltroPreferencia = 'novedadesTareas' | 'recordatoriosFichaje';

export interface NuevaNotificacion {
  organizacionId: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  contenido: string | null;
  referenciaId?: string | null;
  datos?: Prisma.InputJsonValue | null;
  /** Quien provocó el evento (se muestra como autor); no la recibe salvo `incluirActor`. */
  actorId?: string | null;
  usuarioIds: string[];
  incluirActor?: boolean;
  filtro?: FiltroPreferencia;
  /** `false`: solo en la bandeja, sin push (p. ej. la confirmación de la propia entrada). */
  push?: boolean;
}

/**
 * Fan-out de notificaciones (documentacion/06, flujo 9): un evento en `notificaciones`, una fila
 * por destinatario en `notificaciones_usuario` y el push en la cola. Nunca lanza: si algo falla,
 * se registra y la acción que lo originó (crear una tarea, registrar la entrada…) sigue en pie.
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cola: ColaPushService,
  ) {}

  /** Devuelve los usuarios notificados (vacío si no quedó ninguno). */
  async notificar(n: NuevaNotificacion): Promise<string[]> {
    try {
      let usuarioIds = [...new Set(n.usuarioIds)].filter(
        (id) => n.incluirActor || id !== n.actorId,
      );
      if (n.filtro && usuarioIds.length > 0) {
        const excluidos = await this.prisma.preferenciasNotificacion.findMany({
          where: { usuarioId: { in: usuarioIds }, [n.filtro]: false },
          select: { usuarioId: true },
        });
        const fuera = new Set(excluidos.map((p) => p.usuarioId));
        usuarioIds = usuarioIds.filter((id) => !fuera.has(id));
      }
      if (usuarioIds.length === 0) return [];

      const notificacion = await this.prisma.notificacion.create({
        data: {
          organizacionId: n.organizacionId,
          tipo: n.tipo,
          titulo: n.titulo,
          contenido: n.contenido,
          referenciaId: n.referenciaId ?? null,
          datos: n.datos ?? undefined,
          creadoPor: n.actorId ?? null,
          destinatarios: {
            createMany: {
              data: usuarioIds.map((usuarioId) => ({ usuarioId })),
            },
          },
        },
      });

      if (n.push !== false) {
        await this.cola.publicar({
          usuarioIds,
          titulo: n.titulo,
          contenido: n.contenido,
          datos: {
            tipo: n.tipo,
            notificacionId: notificacion.id,
            organizacionId: n.organizacionId,
            referenciaId: n.referenciaId ?? null,
            url: rutaDeNotificacion(n.tipo, n.referenciaId ?? null),
          },
        });
      }
      return usuarioIds;
    } catch (error) {
      this.logger.error(
        `No se pudo crear la notificación ${n.tipo}: ${String(error)}`,
      );
      return [];
    }
  }

  /** Usuarios de los miembros activos de la organización con alguno de los roles dados. */
  async usuariosConRol(
    organizacionId: string,
    roles: Prisma.MiembroOrganizacionWhereInput['rol'],
  ): Promise<string[]> {
    const miembros = await this.prisma.miembroOrganizacion.findMany({
      where: { organizacionId, estado: 'ACTIVO', rol: roles },
      select: { usuarioId: true },
    });
    return miembros.map((m) => m.usuarioId);
  }
}
