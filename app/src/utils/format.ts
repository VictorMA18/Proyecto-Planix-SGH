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
