/** `Acme Corp Central` → `AC` (hasta dos iniciales). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '').slice(0, 2);
  return initials.toUpperCase() || '?';
}

/** `America/Lima` → `America / Lima`. */
export function formatTimeZone(timeZone: string): string {
  return timeZone.replace(/_/g, ' ').replace('/', ' / ');
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMembers(count: number): string {
  return `${count} ${count === 1 ? 'miembro activo' : 'miembros activos'}`;
}

/** `19_320_000 ms` → `5h 22m`. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** Fecha ISO → `hoy`, `ayer` o `hace N días`. */
export function formatDaysAgo(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

/** `2026-10-07T14:35:00Z` → `7 oct, 14:35` (hora local). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Antigüedad desde la fecha de ingreso: `3 años, 4 meses`, `5 meses` o `Menos de un mes`. */
export function formatTenure(iso: string | null, now = new Date()): string {
  if (!iso) return '';
  const start = new Date(iso);
  const months = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()) -
      (now.getDate() < start.getDate() ? 1 : 0),
  );
  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (months < 1) return 'Menos de un mes';
  const yearsText = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : '';
  const monthsText = rest > 0 ? `${rest} ${rest === 1 ? 'mes' : 'meses'}` : '';
  return [yearsText, monthsText].filter(Boolean).join(', ');
}
