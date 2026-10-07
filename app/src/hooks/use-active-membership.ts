import { useOrganizationStore } from '@/stores/useOrganizationStore';
import type { Membership } from '@/types/organization';

/** Membresía con la que se opera: la guardada, o la primera si ya no existe. */
export function useActiveMembership(memberships: Membership[] | undefined) {
  const { activeOrganizationId, setActiveOrganization } = useOrganizationStore();

  const active =
    memberships?.find((m) => m.organizacion.id === activeOrganizationId) ?? memberships?.[0];

  return { activeOrganizationId: active?.organizacion.id ?? null, setActiveOrganization };
}
