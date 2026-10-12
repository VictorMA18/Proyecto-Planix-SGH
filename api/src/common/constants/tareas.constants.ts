import type { RolMiembro } from '@prisma/client';

/** Pueden crear, editar, duplicar y eliminar tareas y gestionar sus adjuntos (documentacion/05). */
export const ROLES_GESTION_TAREAS: RolMiembro[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPERVISOR',
];

/** Rango máximo de días del listado de tareas (un mes visible del calendario). */
export const TAREAS_MAX_DIAS = 62;

export const ETIQUETAS_MAX = 5;
export const ETIQUETA_MAX_LONGITUD = 24;

/** Adjuntos: solo PDF e imágenes de hasta 10 MB (documentacion/03). */
export const ADJUNTO_MAX_BYTES = 10 * 1024 * 1024;
export const ADJUNTOS_MAX = 10;
export const TIPOS_ADJUNTO: Record<string, 'IMAGEN' | 'ARCHIVO'> = {
  'image/jpeg': 'IMAGEN',
  'image/png': 'IMAGEN',
  'image/webp': 'IMAGEN',
  'image/gif': 'IMAGEN',
  'application/pdf': 'ARCHIVO',
};
