// Forma de las respuestas de la API (api/openapi.yaml: Membresia / OrganizacionConMiembros).
export type OrganizationRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'EMPLEADO';

export interface Organization {
  id: string;
  nombre: string;
  slug: string;
  zonaHoraria: string;
  logoUrl: string | null;
  miembrosActivos: number;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  rol: OrganizationRole;
  estado: 'ACTIVO' | 'INVITADO' | 'INACTIVO';
  fechaIngreso: string | null;
  organizacion: Organization;
  createdAt: string;
  updatedAt: string;
}
