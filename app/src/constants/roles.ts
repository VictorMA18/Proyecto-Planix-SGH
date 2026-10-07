import type { OrganizationRole } from '@/types/organization';

// Resumen de permisos por rol (documentacion/05-autenticacion-y-autorizacion.md).
export const ROLE_ACCESS_SUMMARY: Record<OrganizationRole, string> = {
  SUPER_ADMIN: 'Acceso global a todas las organizaciones y reportes',
  ADMIN: 'Configura la organización, gestiona miembros y genera el QR del día',
  SUPERVISOR: 'Crea tareas y consulta los reportes de su equipo',
  EMPLEADO: 'Marca tu asistencia y consulta tus tareas asignadas',
};

/** Nombre legible del rol (el badge usa la etiqueta en mayúsculas de `RoleColors`). */
export const ROLE_NAME: Record<OrganizationRole, string> = {
  SUPER_ADMIN: 'Super administrador',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  EMPLEADO: 'Empleado',
};

/** Resumen corto de lo que puede hacer cada rol, para listas compactas. */
export const ROLE_SHORT_ACCESS: Record<OrganizationRole, string> = {
  SUPER_ADMIN: 'Acceso global',
  ADMIN: 'Control total de la organización',
  SUPERVISOR: 'Gestión de tareas y equipo',
  EMPLEADO: 'Marcación de asistencia',
};
