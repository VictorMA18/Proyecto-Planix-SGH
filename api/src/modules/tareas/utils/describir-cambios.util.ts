import type {
  EstadoTarea,
  PrioridadTarea,
  TipoActividadTarea,
} from '@prisma/client';
import { horaDeMinutos } from '../../../common/utils/hora.util';
import { minutosLocales } from '../../../common/utils/zona-horaria.util';

export const ESTADO_TAREA_TEXTO: Record<EstadoTarea, string> = {
  PENDIENTE: 'Por hacer',
  EN_PROGRESO: 'En progreso',
  REVISION: 'Revisión',
  COMPLETADA: 'Completada',
};

const PRIORIDAD_TEXTO: Record<PrioridadTarea, string> = {
  ALTA: 'Alta',
  MEDIA: 'Normal',
  BAJA: 'Baja',
};

/** Lo que se compara de una tarea antes y después de editarla. */
export interface FotoTarea {
  titulo: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaInicio: Date;
  fechaFin: Date | null;
  ubicacion: string | null;
  descripcion: string | null;
  etiquetas: string[];
  asignados: { usuarioId: string; nombre: string }[];
  subtareas: { id: string; titulo: string; completada: boolean }[];
}

export interface CambioTarea {
  tipo: TipoActividadTarea;
  descripcion: string;
}

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function horario(inicio: Date, fin: Date | null, zona: string): string {
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    day: 'numeric',
    month: 'numeric',
  })
    .formatToParts(inicio)
    .reduce<Record<string, string>>(
      (acc, p) => ({ ...acc, [p.type]: p.value }),
      {},
    );
  const hora = (d: Date) => horaDeMinutos(minutosLocales(d, zona));
  return `${Number(fecha.day)} ${MESES[Number(fecha.month) - 1]}, ${hora(inicio)}${fin ? ` - ${hora(fin)}` : ''}`;
}

/**
 * Un evento de actividad por cada cambio concreto de una edición (prioridad, horario, etiquetas,
 * personas, subtareas…). Si algo vuelve a su valor original no se registra nada.
 */
export function describirCambios(
  antes: FotoTarea,
  despues: FotoTarea,
  actorUsuarioId: string,
  zona: string,
): CambioTarea[] {
  const cambios: CambioTarea[] = [];
  const agregar = (tipo: TipoActividadTarea, descripcion: string) =>
    cambios.push({ tipo, descripcion });

  if (antes.titulo !== despues.titulo)
    agregar('EDITADA', `cambió el título a «${despues.titulo}»`);
  if (antes.estado !== despues.estado)
    agregar('ESTADO', `movió la tarea a ${ESTADO_TAREA_TEXTO[despues.estado]}`);
  if (antes.prioridad !== despues.prioridad) {
    agregar(
      'EDITADA',
      `cambió la prioridad a ${PRIORIDAD_TEXTO[despues.prioridad]}`,
    );
  }
  if (
    antes.fechaInicio.getTime() !== despues.fechaInicio.getTime() ||
    (antes.fechaFin?.getTime() ?? null) !==
      (despues.fechaFin?.getTime() ?? null)
  ) {
    agregar(
      'EDITADA',
      `cambió el horario a ${horario(despues.fechaInicio, despues.fechaFin, zona)}`,
    );
  }
  if ((antes.ubicacion ?? '') !== (despues.ubicacion ?? '')) {
    agregar(
      'EDITADA',
      despues.ubicacion
        ? `cambió la ubicación a «${despues.ubicacion}»`
        : 'quitó la ubicación',
    );
  }
  if ((antes.descripcion ?? '') !== (despues.descripcion ?? ''))
    agregar('EDITADA', 'actualizó la descripción');

  for (const tag of despues.etiquetas.filter(
    (t) => !antes.etiquetas.includes(t),
  )) {
    agregar('EDITADA', `añadió la etiqueta «${tag}»`);
  }
  for (const tag of antes.etiquetas.filter(
    (t) => !despues.etiquetas.includes(t),
  )) {
    agregar('EDITADA', `quitó la etiqueta «${tag}»`);
  }

  const antesIds = new Set(antes.asignados.map((a) => a.usuarioId));
  const despuesIds = new Set(despues.asignados.map((a) => a.usuarioId));
  for (const a of despues.asignados.filter((p) => !antesIds.has(p.usuarioId))) {
    agregar(
      'ASIGNADOS',
      a.usuarioId === actorUsuarioId
        ? 'se asignó la tarea'
        : `asignó a ${a.nombre}`,
    );
  }
  for (const a of antes.asignados.filter((p) => !despuesIds.has(p.usuarioId))) {
    agregar(
      'ASIGNADOS',
      a.usuarioId === actorUsuarioId
        ? 'se quitó de la tarea'
        : `quitó a ${a.nombre}`,
    );
  }

  const previas = new Map(antes.subtareas.map((s) => [s.id, s]));
  for (const s of despues.subtareas) {
    const previa = previas.get(s.id);
    if (!previa) {
      agregar('SUBTAREA', `añadió la subtarea «${s.titulo}»`);
      continue;
    }
    if (previa.titulo !== s.titulo)
      agregar('SUBTAREA', `renombró «${previa.titulo}» a «${s.titulo}»`);
    if (previa.completada !== s.completada) {
      agregar(
        'SUBTAREA',
        `${s.completada ? 'completó' : 'reabrió'} «${s.titulo}»`,
      );
    }
  }
  const quedan = new Set(despues.subtareas.map((s) => s.id));
  for (const s of antes.subtareas.filter((s) => !quedan.has(s.id))) {
    agregar('SUBTAREA', `eliminó la subtarea «${s.titulo}»`);
  }

  return cambios;
}
