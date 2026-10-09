import type { AttendanceMovement, AttendanceToday } from '@/schemas/attendance.schema';

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
    if (movement.tipo === 'ENTRADA') {
      return index === 0
        ? { id: movement.id, kind: 'ENTRADA', title: 'Entrada registrada', detail: 'QR verificado', hora: movement.hora, prevista: false }
        : { id: movement.id, kind: 'RETORNO', title: 'Retorno registrado', detail: 'QR verificado', hora: movement.hora, prevista: false };
    }
    return next
      ? { id: movement.id, kind: 'PAUSA', title: 'Inicio de pausa', detail: 'Pausa registrada', hora: movement.hora, prevista: false }
      : { id: movement.id, kind: 'SALIDA', title: 'Salida registrada', detail: 'Cierre de turno', hora: movement.hora, prevista: false };
  });

  if (today.jornada?.estadoActual === 'DENTRO') {
    events.push({
      id: 'salida-prevista',
      kind: 'PREVISTA',
      title: 'Salida prevista',
      detail: 'Cierre de turno',
      hora: today.turno.fin,
      prevista: true,
    });
  }
  return events;
}

/** Milisegundos trabajados hoy: suma de los tramos ENTRADA → SALIDA (el abierto cuenta hasta `now`). */
export function workedMs(movements: AttendanceMovement[], now: number): number {
  let total = 0;
  let openedAt: number | null = null;
  for (const movement of movements) {
    const time = new Date(movement.hora).getTime();
    if (movement.tipo === 'ENTRADA') openedAt = time;
    else if (openedAt !== null) {
      total += time - openedAt;
      openedAt = null;
    }
  }
  return openedAt !== null ? total + Math.max(0, now - openedAt) : total;
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
