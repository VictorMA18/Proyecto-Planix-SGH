import type { EstadoTarea, TipoNotificacion } from '@prisma/client';

// Textos de cada evento que genera una notificación. Funciones puras: las usan los servicios de
// tareas, turnos, asistencia, invitaciones y recordatorios. El nombre de quien provoca el evento
// va dentro del contenido, y la app lo resalta.

export interface MensajeNotificacion {
  titulo: string;
  contenido: string;
}

const ESTADOS: Record<EstadoTarea, string> = {
  PENDIENTE: 'Por hacer',
  EN_PROGRESO: 'En progreso',
  REVISION: 'Revisión',
  COMPLETADA: 'Completada',
};

const ROLES: Record<string, string> = {
  SUPER_ADMIN: 'super administrador',
  ADMIN: 'administrador',
  SUPERVISOR: 'supervisor',
  EMPLEADO: 'empleado',
};

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/** Recorta un texto largo para el cuerpo de la notificación. */
export function recortar(texto: string, maximo = 80): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > maximo
    ? `${limpio.slice(0, maximo - 1).trimEnd()}…`
    : limpio;
}

/** `[1,2,3,4,5]` → «de lunes a viernes»; `[1,3,5]` → «lun, mié, vie». */
export function describirDias(dias: number[]): string {
  const orden = [...new Set(dias)].sort((a, b) => a - b);
  if (orden.length === 7) return 'todos los días';
  if (orden.join() === '1,2,3,4,5') return 'de lunes a viernes';
  if (orden.join() === '6,7') return 'los fines de semana';
  return orden.map((d) => DIAS[d - 1]).join(', ');
}

export const tareaAsignada = (
  actor: string,
  tarea: string,
): MensajeNotificacion => ({
  titulo: 'Nueva tarea asignada',
  contenido: `${actor} te asignó a «${tarea}».`,
});

export const tareaMovida = (
  actor: string,
  tarea: string,
  estado: EstadoTarea,
): MensajeNotificacion => ({
  titulo:
    estado === 'COMPLETADA'
      ? 'Tarea completada'
      : `Tarea movida a ${ESTADOS[estado]}`,
  contenido: `${actor} movió «${tarea}» a ${ESTADOS[estado]}.`,
});

export const subtareaCompletada = (
  actor: string,
  subtarea: string,
  tarea: string,
): MensajeNotificacion => ({
  titulo: 'Subtarea completada',
  contenido: `${actor} completó «${subtarea}» en «${tarea}».`,
});

export const comentarioTarea = (
  actor: string,
  tarea: string,
  texto: string,
): MensajeNotificacion => ({
  titulo: 'Nuevo comentario',
  contenido: `${actor} comentó en «${tarea}»: «${recortar(texto)}».`,
});

export interface TurnoTexto {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  dias: number[];
}

export const turnoAsignado = (
  actor: string,
  turno: TurnoTexto,
): MensajeNotificacion => ({
  titulo: 'Nuevo turno asignado',
  contenido: `${actor} te asignó el ${turno.nombre} (${turno.horaInicio} - ${turno.horaFin}), ${describirDias(turno.dias)}.`,
});

export const turnoActualizado = (
  actor: string,
  turno: TurnoTexto,
): MensajeNotificacion => ({
  titulo: `Cambio en tu ${turno.nombre}`,
  contenido: `${actor} actualizó tu horario a ${turno.horaInicio} - ${turno.horaFin}, ${describirDias(turno.dias)}.`,
});

export const toleranciaActualizada = (
  actor: string,
  minutos: number,
): MensajeNotificacion => ({
  titulo: 'Tolerancia de entrada actualizada',
  contenido: `${actor} cambió la tolerancia de entrada a ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
});

export const asistenciaRegistrada = (): MensajeNotificacion => ({
  titulo: 'Registro de asistencia exitoso',
  contenido: 'Entrada verificada por código QR dinámico.',
});

export const miembroNuevo = (
  nombre: string,
  rol: string,
): MensajeNotificacion => ({
  titulo: 'Nuevo miembro en tu organización',
  contenido: `${nombre} se unió a la organización como ${ROLES[rol] ?? rol.toLowerCase()}.`,
});

export const recordatorioEntrada = (
  turno: string,
  hora: string,
): MensajeNotificacion => ({
  titulo: 'Tu turno empieza pronto',
  contenido: `Tu ${turno} empieza a las ${hora}. Recuerda escanear el QR al llegar.`,
});

export const recordatorioSalida = (
  turno: string,
  hora: string,
): MensajeNotificacion => ({
  titulo: 'Recuerda registrar tu salida',
  contenido: `Tu ${turno} termina a las ${hora}. Registra tu salida antes de irte.`,
});

/** Asignados + creador de una tarea, sin repetir y sin quien provocó el evento. */
export function destinatariosTarea(
  asignados: string[],
  creadorId: string | null,
  actorId: string,
): string[] {
  return [...new Set([...asignados, ...(creadorId ? [creadorId] : [])])].filter(
    (id) => id !== actorId,
  );
}

/** Pantalla de la app que abre la notificación al tocarla. */
export function rutaDeNotificacion(
  tipo: TipoNotificacion,
  referenciaId: string | null,
): string {
  if (tipo.startsWith('TAREA_') && referenciaId)
    return `/tarea/${referenciaId}`;
  if (tipo.startsWith('TURNO_')) return '/mi-turno';
  if (tipo === 'MIEMBRO_NUEVO' && referenciaId)
    return `/miembro/${referenciaId}`;
  if (
    tipo === 'ASISTENCIA_REGISTRADA' ||
    tipo === 'RECORDATORIO_ENTRADA' ||
    tipo === 'RECORDATORIO_SALIDA' ||
    tipo === 'QR_DISPONIBLE'
  ) {
    return '/asistencia';
  }
  return '/notificaciones';
}

/** Si un instante cae dentro de los próximos `minutos` (sin incluir el presente). */
export function dentroDeLosProximos(
  instante: Date,
  ahora: Date,
  minutos: number,
): boolean {
  const diferencia = instante.getTime() - ahora.getTime();
  return diferencia > 0 && diferencia <= minutos * 60_000;
}
