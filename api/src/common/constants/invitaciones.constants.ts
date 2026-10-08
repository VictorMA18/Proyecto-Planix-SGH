import type { RolMiembro } from '@prisma/client';

// Sin caracteres ambiguos (0/O, 1/I) para que el código sea fácil de escribir en el móvil.
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LONGITUD_CODIGO = 10;

/** Vigencia de la invitación personal (correo + rol). */
export const DIAS_VIGENCIA_INVITACION = 7;

/** Vigencias permitidas para el código genérico, en minutos. */
export const VIGENCIAS_CODIGO_MINUTOS = [5, 10, 15] as const;

/** Roles que se pueden asignar al invitar (no existe invitación a SUPER_ADMIN). */
export const ROLES_INVITABLES: RolMiembro[] = [
  'ADMIN',
  'SUPERVISOR',
  'EMPLEADO',
];

/** Roles que pueden gestionar el equipo (invitar, reenviar, generar códigos). */
export const ROLES_ADMINISTRADORES: RolMiembro[] = ['SUPER_ADMIN', 'ADMIN'];
