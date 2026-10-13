import type {
  ModoAlerta,
  Notificacion,
  NotificacionUsuario,
  PlataformaDispositivo,
  PreferenciasNotificacion,
  PushToken,
  TipoNotificacion,
  Usuario,
} from '@prisma/client';

export type NotificacionDeBandeja = NotificacionUsuario & {
  notificacion: Notificacion & {
    creador: Pick<Usuario, 'id' | 'nombre'> | null;
  };
};

/** `include` de Prisma con lo que necesita `NotificacionResponseDto`. */
export const INCLUDE_BANDEJA = {
  notificacion: {
    include: { creador: { select: { id: true, nombre: true } } },
  },
} as const;

export class ActorNotificacionResponseDto {
  id!: string;
  nombre!: string;
}

export class AsistenciaNotificacionResponseDto {
  puntual!: boolean;
  turno!: string;
}

/** Una notificación de la bandeja: el evento con el estado de lectura del usuario. */
export class NotificacionResponseDto {
  /** Id del registro del destinatario: sobre él se marca «leída». */
  id!: string;
  notificacionId!: string;
  organizacionId!: string | null;
  tipo!: TipoNotificacion;
  titulo!: string;
  contenido!: string | null;
  referenciaId!: string | null;
  actor!: ActorNotificacionResponseDto | null;
  asistencia!: AsistenciaNotificacionResponseDto | null;
  leida!: boolean;
  leidaEn!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(fila: NotificacionDeBandeja): NotificacionResponseDto {
    const { notificacion } = fila;
    const datos = (notificacion.datos ?? {}) as Partial<
      Record<'puntual' | 'turno', unknown>
    >;
    const asistencia =
      notificacion.tipo === 'ASISTENCIA_REGISTRADA' &&
      typeof datos.puntual === 'boolean' &&
      typeof datos.turno === 'string'
        ? { puntual: datos.puntual, turno: datos.turno }
        : null;
    return Object.assign(new NotificacionResponseDto(), {
      id: fila.id,
      notificacionId: notificacion.id,
      organizacionId: notificacion.organizacionId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      contenido: notificacion.contenido,
      referenciaId: notificacion.referenciaId,
      actor: notificacion.creador
        ? { id: notificacion.creador.id, nombre: notificacion.creador.nombre }
        : null,
      asistencia,
      leida: fila.leida,
      leidaEn: fila.leidaEn,
      createdAt: fila.createdAt,
      updatedAt: fila.updatedAt,
    });
  }
}

export class LeerTodasResponseDto {
  actualizadas!: number;
}

export class DifusionResponseDto {
  notificacionesCreadas!: number;
}

/** Preferencias del usuario; sin fila guardada, los valores por defecto. */
export class PreferenciasResponseDto {
  push!: boolean;
  recordatoriosFichaje!: boolean;
  novedadesTareas!: boolean;
  modoAlerta!: ModoAlerta;

  static desde(fila: PreferenciasNotificacion | null): PreferenciasResponseDto {
    return Object.assign(new PreferenciasResponseDto(), {
      push: fila?.push ?? true,
      recordatoriosFichaje: fila?.recordatoriosFichaje ?? true,
      novedadesTareas: fila?.novedadesTareas ?? true,
      modoAlerta: fila?.modoAlerta ?? 'SONIDO',
    });
  }
}

/** Token registrado. No devuelve las claves de la suscripción web, solo su endpoint. */
export class PushTokenResponseDto {
  id!: string;
  usuarioId!: string;
  plataforma!: PlataformaDispositivo;
  expoPushToken!: string | null;
  webPushSubscription!: { endpoint: string } | null;
  activo!: boolean;
  ultimaVezUsado!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(token: PushToken): PushTokenResponseDto {
    const suscripcion = token.webPushSuscripcion as {
      endpoint?: string;
    } | null;
    return Object.assign(new PushTokenResponseDto(), {
      id: token.id,
      usuarioId: token.usuarioId,
      plataforma: token.plataforma,
      expoPushToken: token.expoPushToken,
      webPushSubscription: suscripcion?.endpoint
        ? { endpoint: suscripcion.endpoint }
        : null,
      activo: token.activo,
      ultimaVezUsado: token.ultimaVezUsado,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    });
  }
}

export class ClaveWebResponseDto {
  clavePublica!: string;
}
