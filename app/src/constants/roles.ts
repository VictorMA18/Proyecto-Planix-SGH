import type { OrganizationRole } from '@/types/organization';

// Resumen de permisos por rol (documentacion/05-autenticacion-y-autorizacion.md).
export const ROLE_ACCESS_SUMMARY: Record<OrganizationRole, string> = {
  SUPER_ADMIN: 'Acceso global a todas las organizaciones y reportes',
  ADMIN: 'Configura la organización, gestiona miembros y genera el QR del día',
  SUPERVISOR: 'Crea tareas y consulta los reportes de su equipo',
  EMPLEADO: 'Marca tu asistencia y consulta tus tareas asignadas',
};
