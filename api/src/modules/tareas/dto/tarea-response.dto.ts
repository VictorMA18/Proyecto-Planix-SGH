import type {
  EstadoTarea,
  Prisma,
  PrioridadTarea,
  Usuario,
} from '@prisma/client';

/** Relaciones que se cargan siempre con una tarea. */
export const INCLUDE_TAREA = {
  asignaciones: { include: { usuario: true }, orderBy: { createdAt: 'asc' } },
  subtareas: { orderBy: { orden: 'asc' } },
  creador: true,
  _count: { select: { comentarios: true } },
} satisfies Prisma.TareaInclude;

export type TareaCompleta = Prisma.TareaGetPayload<{
  include: typeof INCLUDE_TAREA;
}>;

/** Adjunto tal como se guarda en `tareas.adjuntos` (JSONB). `cloudinaryPublicId` nunca sale. */
export interface AdjuntoGuardado {
  id: string;
  tipo: 'IMAGEN' | 'ARCHIVO';
  url: string;
  cloudinaryPublicId: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  orden: number;
  createdAt: string;
}

export const leerAdjuntos = (valor: Prisma.JsonValue): AdjuntoGuardado[] =>
  Array.isArray(valor) ? (valor as unknown as AdjuntoGuardado[]) : [];

/** Para mostrar a las personas: el id de su membresía en la organización (si sigue en ella). */
export type MiembroPorUsuario = Map<string, string>;

export class PersonaTareaDto {
  miembroId!: string | null;
  nombre!: string;
  avatarUrl!: string | null;

  static desde(
    usuario: Usuario | null,
    miembros: MiembroPorUsuario,
  ): PersonaTareaDto {
    return Object.assign(new PersonaTareaDto(), {
      miembroId: usuario ? (miembros.get(usuario.id) ?? null) : null,
      nombre: usuario?.nombre ?? 'Persona eliminada',
      avatarUrl: usuario?.avatarUrl ?? null,
    });
  }
}

export class AdjuntoResponseDto {
  id!: string;
  tipo!: 'IMAGEN' | 'ARCHIVO';
  url!: string;
  nombreArchivo!: string;
  mimeType!: string;
  tamanoBytes!: number;
  orden!: number;
  createdAt!: string;

  static desde(a: AdjuntoGuardado): AdjuntoResponseDto {
    return Object.assign(new AdjuntoResponseDto(), {
      id: a.id,
      tipo: a.tipo,
      url: a.url,
      nombreArchivo: a.nombreArchivo,
      mimeType: a.mimeType,
      tamanoBytes: a.tamanoBytes,
      orden: a.orden,
      createdAt: a.createdAt,
    });
  }
}

/** Tarea en el calendario (TareaCalendario en api/openapi.yaml). */
export class TareaCalendarioResponseDto {
  id!: string;
  titulo!: string;
  descripcion!: string | null;
  prioridad!: PrioridadTarea;
  estado!: EstadoTarea;
  fechaInicio!: Date;
  fechaFin!: Date | null;
  ubicacion!: string | null;
  etiquetas!: string[];
  asignados!: PersonaTareaDto[];
  asignadaAMi!: boolean;
  subtareas!: { completadas: number; total: number };
  comentarios!: number;
  creadaPor!: PersonaTareaDto;

  protected static campos(
    tarea: TareaCompleta,
    miembros: MiembroPorUsuario,
    usuarioId: string,
  ) {
    return {
      id: tarea.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      prioridad: tarea.prioridad,
      estado: tarea.estado,
      fechaInicio: tarea.fechaInicio,
      fechaFin: tarea.fechaFin,
      ubicacion: tarea.ubicacion,
      etiquetas: tarea.etiquetas,
      // Solo quienes siguen siendo miembros activos aparecen como asignados.
      asignados: tarea.asignaciones
        .filter((a) => miembros.has(a.usuarioId))
        .map((a) => PersonaTareaDto.desde(a.usuario, miembros)),
      asignadaAMi: tarea.asignaciones.some((a) => a.usuarioId === usuarioId),
      subtareas: {
        completadas: tarea.subtareas.filter((s) => s.completada).length,
        total: tarea.subtareas.length,
      },
      comentarios: tarea._count.comentarios,
      creadaPor: PersonaTareaDto.desde(tarea.creador, miembros),
    };
  }

  static desde(
    tarea: TareaCompleta,
    miembros: MiembroPorUsuario,
    usuarioId: string,
  ): TareaCalendarioResponseDto {
    return Object.assign(
      new TareaCalendarioResponseDto(),
      this.campos(tarea, miembros, usuarioId),
    );
  }
}

/** Detalle de una tarea (TareaDetalle en api/openapi.yaml). */
export class TareaDetalleResponseDto extends TareaCalendarioResponseDto {
  listaSubtareas!: { id: string; titulo: string; completada: boolean }[];
  adjuntos!: AdjuntoResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;

  static desde(
    tarea: TareaCompleta,
    miembros: MiembroPorUsuario,
    usuarioId: string,
  ): TareaDetalleResponseDto {
    return Object.assign(new TareaDetalleResponseDto(), {
      ...this.campos(tarea, miembros, usuarioId),
      listaSubtareas: tarea.subtareas.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        completada: s.completada,
      })),
      adjuntos: leerAdjuntos(tarea.adjuntos)
        .sort((a, b) => a.orden - b.orden)
        .map((a) => AdjuntoResponseDto.desde(a)),
      createdAt: tarea.createdAt,
      updatedAt: tarea.updatedAt,
    });
  }
}
