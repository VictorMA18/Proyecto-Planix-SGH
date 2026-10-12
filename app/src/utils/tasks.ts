import type {
  CalendarTask,
  TaskPriority,
  TaskPriorityFilter,
  TaskSort,
  TaskStatusFilter,
} from '@/schemas/task.schema';

// Utilidades puras de la pestaña «Tareas»: calendario, filtros, conteos y formatos. Las fechas de
// calendario son texto `YYYY-MM-DD` en la hora local del dispositivo.

const pad = (n: number) => String(n).padStart(2, '0');

/** `Date` → `YYYY-MM-DD` (calendario local). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → `Date` a medianoche local. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface CalendarDay {
  key: string;
  day: number;
  inMonth: boolean;
}

/** Semanas (lunes a domingo) que cubren el mes, con los días vecinos para completar las filas. */
export function monthGrid(month: string): CalendarDay[][] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(y, m, 0);

  const weeks: CalendarDay[][] = [];
  const cursor = new Date(start);
  while (cursor <= last || weeks.length === 0 || cursor.getDay() !== 1) {
    if (cursor.getDay() === 1) weeks.push([]);
    weeks[weeks.length - 1].push({
      key: toDateKey(cursor),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === m - 1,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}

/** Primer y último día visibles del calendario del mes (para pedir sus tareas). */
export function monthRange(month: string): { desde: string; hasta: string } {
  const weeks = monthGrid(month);
  return { desde: weeks[0][0].key, hasta: weeks[weeks.length - 1][6].key };
}

/** Día local de una tarea (`YYYY-MM-DD`). */
export const taskDay = (task: CalendarTask) => toDateKey(new Date(task.fechaInicio));

/** Sin completar y con la hora de fin (o de inicio) ya pasada. */
export function isOverdue(task: CalendarTask, now: number): boolean {
  return task.estado !== 'COMPLETADA' && new Date(task.fechaFin ?? task.fechaInicio).getTime() < now;
}

/** Ocurre ahora mismo. */
export function isOngoing(task: CalendarTask, now: number): boolean {
  const start = new Date(task.fechaInicio).getTime();
  const end = task.fechaFin ? new Date(task.fechaFin).getTime() : start;
  return start <= now && now <= end;
}

/** Filtros de miembro y prioridad (los que también afectan a los puntos del calendario). */
export function filterTasks(
  tasks: CalendarTask[],
  { memberId, priority }: { memberId: string | null; priority: TaskPriorityFilter },
): CalendarTask[] {
  return tasks.filter(
    (task) =>
      (!memberId || task.asignados.some((a) => a.miembroId === memberId)) &&
      (priority === 'TODAS' || task.prioridad === priority),
  );
}

export function matchesStatus(task: CalendarTask, status: TaskStatusFilter, now: number): boolean {
  if (status === 'TODAS') return true;
  if (status === 'VENCIDAS') return isOverdue(task, now);
  return task.estado === status;
}

/** Cuántas tareas hay por cada pestaña de estado. */
export function countByStatus(tasks: CalendarTask[], now: number): Record<TaskStatusFilter, number> {
  return {
    TODAS: tasks.length,
    PENDIENTE: tasks.filter((t) => t.estado === 'PENDIENTE').length,
    EN_PROGRESO: tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
    REVISION: tasks.filter((t) => t.estado === 'REVISION').length,
    COMPLETADA: tasks.filter((t) => t.estado === 'COMPLETADA').length,
    VENCIDAS: tasks.filter((t) => isOverdue(t, now)).length,
  };
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

export function sortTasks(tasks: CalendarTask[], sort: TaskSort): CalendarTask[] {
  const byTime = (a: CalendarTask, b: CalendarTask) => a.fechaInicio.localeCompare(b.fechaInicio);
  return [...tasks].sort((a, b) =>
    sort === 'PRIORIDAD' ? PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad] || byTime(a, b) : byTime(a, b),
  );
}

export interface DayDots {
  urgent: number;
  normal: number;
  low: number;
}

/** Tareas por día y prioridad: urgentes (ALTA), normales (MEDIA) y bajas, para el calendario. */
export function dotsByDay(tasks: CalendarTask[]): Map<string, DayDots> {
  const dots = new Map<string, DayDots>();
  for (const task of tasks) {
    const key = taskDay(task);
    const entry = dots.get(key) ?? { urgent: 0, normal: 0, low: 0 };
    if (task.prioridad === 'ALTA') entry.urgent++;
    else if (task.prioridad === 'MEDIA') entry.normal++;
    else entry.low++;
    dots.set(key, entry);
  }
  return dots;
}

export type DotKind = keyof DayDots;

const DOT_ORDER: DotKind[] = ['urgent', 'normal', 'low'];

/**
 * Hasta `max` puntos para un día. Cada tipo presente tiene al menos uno (si hay de los tres, se ven
 * los tres) y los huecos libres se reparten por prioridad: primero urgentes, luego normales y bajas.
 */
export function dayMarks(dots: DayDots | undefined, max = 3): DotKind[] {
  if (!dots) return [];
  const left = { ...dots };
  const marks: DotKind[] = [];
  for (const kind of DOT_ORDER) {
    if (left[kind] > 0 && marks.length < max) {
      marks.push(kind);
      left[kind]--;
    }
  }
  for (const kind of DOT_ORDER) {
    while (left[kind] > 0 && marks.length < max) {
      marks.push(kind);
      left[kind]--;
    }
  }
  // Mismo orden visual siempre: urgentes, normales, bajas.
  return marks.sort((a, b) => DOT_ORDER.indexOf(a) - DOT_ORDER.indexOf(b));
}

/** Avance de una tarea: sus subtareas completadas o, si no tiene, el tiempo transcurrido de su horario. */
export function taskProgress(task: CalendarTask, now: number): number {
  if (task.subtareas.total > 0) return Math.round((task.subtareas.completadas / task.subtareas.total) * 100);
  if (task.fechaFin && isOngoing(task, now)) {
    const start = new Date(task.fechaInicio).getTime();
    const end = new Date(task.fechaFin).getTime();
    return Math.round(((now - start) / Math.max(1, end - start)) * 100);
  }
  return task.estado === 'COMPLETADA' ? 100 : 0;
}

/** `Vence en 2 días`, `Vence hoy a las 17:00`, `Venció hace 3 días`. */
export function formatDue(task: CalendarTask, now: number): string {
  const due = new Date(task.fechaFin ?? task.fechaInicio);
  const days = Math.round((fromDateKey(toDateKey(due)).getTime() - fromDateKey(toDateKey(new Date(now))).getTime()) / 86_400_000);
  if (task.estado === 'COMPLETADA') return 'Completada';
  if (days === 0) return due.getTime() < now ? `Venció hoy a las ${clock(due.toISOString())}` : `Vence hoy a las ${clock(due.toISOString())}`;
  if (days > 0) return days === 1 ? 'Vence mañana' : `Vence en ${days} días`;
  return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`;
}

/** `23 oct 2026`. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

/** Hace cuánto: `ahora`, `hace 5 min`, `hace 3 h`, `hace 2 días` o la fecha. */
export function formatAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 24 * 60) return `hace ${Math.floor(minutes / 60)} h`;
  const days = Math.floor(minutes / (24 * 60));
  return days < 7 ? `hace ${days} ${days === 1 ? 'día' : 'días'}` : formatShortDate(iso);
}

/** Partes del formulario a partir de las fechas de una tarea. */
export function taskFormDateParts(task: { fechaInicio: string; fechaFin: string | null }) {
  return {
    fecha: toDateKey(new Date(task.fechaInicio)),
    horaInicio: clock(task.fechaInicio),
    horaFin: task.fechaFin ? clock(task.fechaFin) : '',
  };
}

/** `2400000` → `2,3 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** `2026-10` → `Octubre 2026`. */
export function formatMonthTitle(month: string): string {
  return capitalize(fromDateKey(`${month}-01`).toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(' de ', ' '));
}

/** `2026-10-11` → `Domingo, 11 de octubre`. */
export function formatDayTitle(key: string): string {
  const date = fromDateKey(key);
  const weekday = capitalize(date.toLocaleDateString('es', { weekday: 'long' }));
  return `${weekday}, ${date.getDate()} de ${date.toLocaleDateString('es', { month: 'long' })}`;
}

/** `2026-10-11` → `domingo 11 de octubre` (para lectores de pantalla). */
export function formatDayA11y(key: string): string {
  return fromDateKey(key).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** `Dom 11` (botón «Hoy»). */
export function formatShortDay(key: string): string {
  const date = fromDateKey(key);
  const weekday = date.toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
  return `${capitalize(weekday)} ${date.getDate()}`;
}

const clock = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** `09:00 - 11:00` (o solo la hora de inicio si no tiene fin). */
export function formatTimeRange(task: CalendarTask): string {
  return task.fechaFin ? `${clock(task.fechaInicio)} - ${clock(task.fechaFin)}` : clock(task.fechaInicio);
}
