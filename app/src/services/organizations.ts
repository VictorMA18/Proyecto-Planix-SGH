import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Membership, Organization } from '@/types/organization';

import { useApiClient } from './api-client';

const membershipsKey = (userId: string | null | undefined) => ['memberships', userId] as const;

/** Membresías del usuario autenticado (cada una con su organización y rol). */
export function useMemberships() {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: membershipsKey(userId),
    queryFn: () => api<Membership[]>('/me/membresias'),
    enabled: !!userId,
  });
}

export function useCreateOrganization() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (input: { nombre: string; zonaHoraria?: string }) =>
      api<Organization>('/organizaciones', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membershipsKey(userId) }),
  });
}

export function useAcceptInvitation() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (code: string) =>
      api<unknown>(`/invitaciones/${encodeURIComponent(code)}/aceptar`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membershipsKey(userId) }),
  });
}
