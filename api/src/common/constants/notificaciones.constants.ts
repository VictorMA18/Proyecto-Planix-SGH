import type { RolMiembro } from '@prisma/client';

/** Pueden difundir avisos a la organización (documentacion/06, flujo 8). */
export const ROLES_DIFUSION: RolMiembro[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPERVISOR',
];

/** Reciben el aviso de «miembro nuevo» y ven el resumen de cualquier miembro. */
export const ROLES_SUPERVISION: RolMiembro[] = ROLES_DIFUSION;

/** Minutos de anticipación de los recordatorios de entrada y de salida. */
export const RECORDATORIO_ANTICIPACION_MIN = 15;

export const DIFUSION_TITULO_MIN = 3;
export const DIFUSION_TITULO_MAX = 120;
export const DIFUSION_CONTENIDO_MAX = 500;
/** Tamaño de página por defecto de la bandeja (el máximo es 100, como en el resto de la API). */
export const BANDEJA_PAGINA = 50;
