import { NOTIFICATION_TYPES } from '@/constants/notifications';
import type {
  AppNotification,
  NotificationCategory,
  NotificationReadFilter,
} from '@/schemas/notification.schema';
import { formatClock24 } from '@/utils/format';
import { toDateKey } from '@/utils/tasks';

export type NotificationSectionKey = 'HOY' | 'AYER' | 'SEMANA' | 'ANTERIORES';

export const NOTIFICATION_SECTION_LABELS: Record<NotificationSectionKey, string> = {
  HOY: 'Hoy',
  AYER: 'Ayer',
  SEMANA: 'Esta semana',
  ANTERIORES: 'Anteriores',
};

export interface NotificationSection {
  key: NotificationSectionKey;
  title: string;
  pending: number;
  data: AppNotification[];
}

export const categoryOf = (notification: AppNotification): NotificationCategory =>
  NOTIFICATION_TYPES[notification.tipo].category;

/** Días de calendario (locales) entre la fecha y hoy. */
function daysAgo(iso: string, now: number): number {
  const day = new Date(`${toDateKey(new Date(iso))}T00:00:00`).getTime();
  const today = new Date(`${toDateKey(new Date(now))}T00:00:00`).getTime();
  return Math.round((today - day) / 86_400_000);
}

function sectionOf(iso: string, now: number): NotificationSectionKey {
  const days = daysAgo(iso, now);
  if (days <= 0) return 'HOY';
  if (days === 1) return 'AYER';
  return days < 7 ? 'SEMANA' : 'ANTERIORES';
}

/** Agrupa (ya ordenadas, más recientes primero) en Hoy, Ayer, Esta semana y Anteriores. */
export function groupNotifications(items: AppNotification[], now: number): NotificationSection[] {
  const sections = new Map<NotificationSectionKey, NotificationSection>();
  for (const item of items) {
    const key = sectionOf(item.createdAt, now);
    const section = sections.get(key) ?? { key, title: NOTIFICATION_SECTION_LABELS[key], pending: 0, data: [] };
    section.data.push(item);
    if (!item.leida) section.pending += 1;
    sections.set(key, section);
  }
  return [...sections.values()];
}

/** `Hace 12 min` (la última hora), `08:59 hrs` (hoy y ayer), `Lun, 14:10` (la semana) o `5 oct`. */
export function formatNotificationTime(iso: string, now: number): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  const days = daysAgo(iso, now);
  if (days <= 0 && minutes < 60) return minutes < 1 ? 'Ahora' : `Hace ${minutes} min`;
  if (days <= 1) return `${formatClock24(iso)} hrs`;
  const date = new Date(iso);
  if (days < 7) {
    const weekday = date.toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatClock24(iso)}`;
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function filterNotifications(
  items: AppNotification[],
  read: NotificationReadFilter,
  category: NotificationCategory | null,
): AppNotification[] {
  return items.filter(
    (item) => (read === 'TODAS' || !item.leida) && (category === null || categoryOf(item) === category),
  );
}

export function countByCategory(items: AppNotification[]): Record<NotificationCategory, number> {
  const counts: Record<NotificationCategory, number> = { TURNOS: 0, TAREAS: 0, ASISTENCIA: 0, AVISOS: 0, SISTEMA: 0 };
  for (const item of items) counts[categoryOf(item)] += 1;
  return counts;
}

/** Parte el contenido para resaltar el nombre de quien provocó el evento. */
export function highlightActor(content: string, actor: string | undefined): { text: string; bold: boolean }[] {
  const index = actor ? content.indexOf(actor) : -1;
  if (!actor || index < 0) return [{ text: content, bold: false }];
  return [
    { text: content.slice(0, index), bold: false },
    { text: actor, bold: true },
    { text: content.slice(index + actor.length), bold: false },
  ].filter((part) => part.text.length > 0);
}
