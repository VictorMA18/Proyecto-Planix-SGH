import { useMemberships } from '@/services/organizations';
import { useOrganizationStore } from '@/stores/useOrganizationStore';
import type { Membership } from '@/types/organization';

/** Membresía con la que se opera: la guardada, o la primera si ya no existe. */
export function useActiveMembership(memberships: Membership[] | undefined) {
  const { activeOrganizationId, setActiveOrganization } = useOrganizationStore();

  const active =
    memberships?.find((m) => m.organizacion.id === activeOrganizationId) ?? memberships?.[0];

  return { activeOrganizationId: active?.organizacion.id ?? null, setActiveOrganization };
}

/** Organización activa del usuario con su rol y permisos de gestión. */
export function useActiveOrganization() {
  const query = useMemberships();
  const { activeOrganizationId } = useActiveMembership(query.data);

  const membership = query.data?.find((m) => m.organizacion.id === activeOrganizationId);
  const role = membership?.rol;

  return {
    membership,
    organization: membership?.organizacion,
    role,
    // Invitar y gestionar miembros: SUPER_ADMIN y ADMIN (documentacion/05).
    canManageTeam: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
