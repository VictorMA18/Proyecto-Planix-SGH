import type { TeamRole } from '@/schemas/team.schema';

interface PermissionInput {
  /** Rol de quien mira la pantalla en la organización activa. */
  viewerRole: TeamRole | undefined;
  /** `id` de la membresía de quien mira (para reconocerse a sí mismo en la lista). */
  viewerMembershipId: string | undefined;
  /** Miembro sobre el que se quiere actuar. */
  member: { id: string; rol: TeamRole };
}

/**
 * Si se puede cambiar el rol o quitar a `member`. Replica las reglas del backend (que es quien
 * decide): solo un ADMIN, nunca a uno mismo y solo un SUPER_ADMIN toca a otro SUPER_ADMIN.
 */
export function canModifyMember({ viewerRole, viewerMembershipId, member }: PermissionInput): boolean {
  if (viewerRole !== 'ADMIN' && viewerRole !== 'SUPER_ADMIN') return false;
  if (member.id === viewerMembershipId) return false;
  if (member.rol === 'SUPER_ADMIN' && viewerRole !== 'SUPER_ADMIN') return false;
  return true;
}
