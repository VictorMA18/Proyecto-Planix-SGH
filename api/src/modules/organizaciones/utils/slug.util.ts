/** `Acme Corp Central` → `acme-corp-central` (sin acentos, solo a-z, 0-9 y guiones). */
export function slugify(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150)
    .replace(/-+$/g, '');
  return slug || 'organizacion';
}
