import { BadRequestException } from '@nestjs/common';

export interface CrearOrganizacionData {
  nombre: string;
  zonaHoraria: string;
}

const ZONA_HORARIA_POR_DEFECTO = 'America/Lima';

function zonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

export function validarCrearOrganizacion(body: unknown): CrearOrganizacionData {
  const { nombre, zonaHoraria } = (body ?? {}) as Record<string, unknown>;

  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.trim().length > 150) {
    throw new BadRequestException('El nombre debe tener entre 2 y 150 caracteres.');
  }

  const zona = zonaHoraria === undefined ? ZONA_HORARIA_POR_DEFECTO : zonaHoraria;
  if (typeof zona !== 'string' || zona.length > 64 || !zonaHorariaValida(zona)) {
    throw new BadRequestException('La zona horaria no es válida.');
  }

  return { nombre: nombre.trim(), zonaHoraria: zona };
}

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
