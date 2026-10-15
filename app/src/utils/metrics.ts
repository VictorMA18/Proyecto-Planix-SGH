import type { PeriodType } from '@/schemas/metrics.schema';

import { toDateKey } from './tasks';

/** `YYYY-MM-DD` → `Date` a mediodía local (evita saltos de día por la zona horaria). */
const parse = (fecha: string) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Primer día del periodo (lunes de la semana o día 1 del mes) que contiene `fecha`. */
export function periodStart(type: PeriodType, fecha: string): string {
  const day = parse(fecha);
  if (type === 'MES') return toDateKey(new Date(day.getFullYear(), day.getMonth(), 1, 12));
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return toDateKey(day);
}

/** Fecha de referencia del periodo siguiente (`+1`) o anterior (`-1`). */
export function shiftPeriod(type: PeriodType, fecha: string, delta: number): string {
  const day = parse(periodStart(type, fecha));
  if (type === 'MES') day.setMonth(day.getMonth() + delta);
  else day.setDate(day.getDate() + 7 * delta);
  return toDateKey(day);
}

/** Último día del periodo (domingo de la semana o último día del mes) que contiene `fecha`. */
export function periodEnd(type: PeriodType, fecha: string): string {
  const day = parse(shiftPeriod(type, fecha, 1));
  day.setDate(day.getDate() - 1);
  return toDateKey(day);
}

/** Si el periodo de `fecha` es el actual (no se puede avanzar más allá). */
export function isCurrentPeriod(type: PeriodType, fecha: string, today = toDateKey(new Date())): boolean {
  return periodStart(type, fecha) === periodStart(type, today);
}

/** «12 – 18 Octubre», «28 Sep – 4 Oct» u «Octubre 2026». */
export function formatPeriod(type: PeriodType, desde: string, hasta: string): string {
  const start = parse(desde);
  const end = parse(hasta);
  if (type === 'MES') {
    return capitalize(start.toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(' de ', ' '));
  }
  const month = (date: Date, style: 'long' | 'short') =>
    capitalize(date.toLocaleDateString('es', { month: style }).replace('.', ''));
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${end.getDate()} ${month(end, 'long')}`
    : `${start.getDate()} ${month(start, 'short')} – ${end.getDate()} ${month(end, 'short')}`;
}

/** `54.8` → `54,8h`. */
export function formatHoursShort(hours: number): string {
  return `${hours.toLocaleString('es', { maximumFractionDigits: 1 })}h`;
}

/** `95.2` → `95,2%`; `null` → `—`. */
export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('es', { maximumFractionDigits: 1 })}%`;
}

/** Variación con signo: `+8,4%` / `-3%`. */
export function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('es', { maximumFractionDigits: 1 })}%`;
}

/** `2026-10-14` → `Mié 14 oct`. */
export function formatLogDay(fecha: string): string {
  return capitalize(
    parse(fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''),
  );
}
