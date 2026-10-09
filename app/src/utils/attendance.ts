import type { AttendanceToday } from '@/schemas/attendance.schema';
import type { ReportRange } from '@/schemas/report.schema';

export type TimelineKind = 'ENTRADA' | 'PAUSA' | 'RETORNO' | 'SALIDA' | 'PREVISTA';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  /** ISO de la hora del evento. */
  hora: string;
  /** Un evento previsto aún no ocurrió (la salida del turno). */
  prevista: boolean;
}

/**
 * Convierte los movimientos ENTRADA/SALIDA del contrato en los eventos que ve el usuario: una SALIDA
 * seguida de otra ENTRADA es una pausa y esa ENTRADA, un retorno; la última SALIDA es la salida.
 */
export function buildTimeline(today: AttendanceToday): TimelineEvent[] {
  const movements = today.jornada?.movimientos ?? [];
  const events: TimelineEvent[] = movements.map((movement, index) => {
    const next = movements[index + 1];
    const base = { id: movement.id, hora: movement.hora, prevista: false };
    if (movement.tipo === 'ENTRADA') {
      return index === 0
        ? { ...base, kind: 'ENTRADA', title: 'Entrada registrada', detail: 'QR verificado' }
        : { ...base, kind: 'RETORNO', title: 'Retorno registrado', detail: 'QR verificado' };
    }
    return next
      ? { ...base, kind: 'PAUSA', title: 'Inicio de pausa', detail: 'Salida intermedia' }
      : { ...base, kind: 'SALIDA', title: 'Salida registrada', detail: 'Cierre de jornada' };
  });

  if (today.jornada?.estadoActual === 'DENTRO' && today.turno) {
    events.push({
      id: 'salida-prevista',
      kind: 'PREVISTA',
      title: 'Salida prevista',
      detail: `Fin de ${today.turno.nombre}`,
      hora: today.turno.fin,
      prevista: true,
    });
  }
  return events;
}

/**
 * Milisegundos trabajados ahora: lo que calculó el servidor más el tiempo transcurrido desde
 * `calculadoEn` si sigue dentro. No depende de que el reloj del móvil coincida con el del servidor
 * más allá de ese intervalo.
 */
export function liveWorkedMs(
  minutosTrabajados: number,
  estado: 'DENTRO' | 'FUERA' | undefined,
  calculadoEn: string,
  now: number,
): number {
  const base = minutosTrabajados * 60_000;
  return estado === 'DENTRO' ? base + Math.max(0, now - new Date(calculadoEn).getTime()) : base;
}

/** `342` → `5h 42m`. */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Fechas `desde` y `hasta` (`YYYY-MM-DD`, calendario del dispositivo) de un rango rápido. */
export function reportRangeDates(range: ReportRange, today = new Date()): { desde: string; hasta: string } {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7));

  if (range === 'ESTE_MES') {
    return { desde: isoDate(new Date(day.getFullYear(), day.getMonth(), 1)), hasta: isoDate(day) };
  }
  if (range === 'SEMANA_PASADA') {
    const start = new Date(monday);
    start.setDate(monday.getDate() - 7);
    const end = new Date(monday);
    end.setDate(monday.getDate() - 1);
    return { desde: isoDate(start), hasta: isoDate(end) };
  }
  return { desde: isoDate(monday), hasta: isoDate(day) };
}

/** `2026-10-09` → `vie 9 oct` (sin desfase de zona horaria). */
export function formatDayLabel(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Duración en horas entre `HH:mm` de inicio y fin (si el fin es menor, el turno cruza la medianoche). */
export function shiftHours(start: string, end: string): number {
  const toMin = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  let minutes = toMin(end) - toMin(start);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}

/** `07:00` → `07:00 AM`. */
export function formatShiftTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** `8.5` → `8,5 h`. */
export function formatHours(hours: number): string {
  return `${hours.toString().replace('.', ',')} h`;
}
