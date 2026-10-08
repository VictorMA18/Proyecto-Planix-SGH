import { useAuth } from '@clerk/expo';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TEAM_PAGE_SIZE } from '@/constants/team';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { mockMemberSample } from '@/mocks/member-sample';
import {
  genericCodeSchema,
  invitationCodeSchema,
  memberProfileSchema,
  memberSampleSchema,
  personalInviteSchema,
  personalInvitationCreatedSchema,
  teamInvitationSchema,
  teamPageSchema,
  type ChangeRoleInput,
  type GenericCodeInput,
  type InvitationCode,
  type PersonalInviteInput,
  type TeamQuery,
} from '@/schemas/team.schema';

import { useApiClient } from './api-client';

// Capa de servicio de «Equipo y Miembros»: llama a la API y valida cada respuesta con Zod.

const teamKey = (userId: string | null | undefined, organizationId: string | undefined) =>
  ['team', userId, organizationId] as const;

/** Equipo de la organización activa (miembros + invitaciones pendientes), con filtro y paginación. */
export function useTeam({ search, filter, page }: TeamQuery) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const organizationId = organization?.id;

  return useQuery({
    queryKey: [...teamKey(userId, organizationId), { search, filter, page }],
    // GET /organizaciones/{organizacionId}/equipo?q&filtro&page&pageSize
    queryFn: async () => {
      const params = new URLSearchParams({
        filtro: filter,
        page: String(page),
        pageSize: String(TEAM_PAGE_SIZE),
      });
      if (search.trim()) params.set('q', search.trim());

      return teamPageSchema.parse(
        await api<unknown>(`/organizaciones/${organizationId}/equipo?${params.toString()}`),
      );
    },
    enabled: !!userId && !!organizationId,
    placeholderData: keepPreviousData,
  });
}

function useTeamMutationContext() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const queryClient = useQueryClient();

  const organizationId = organization?.id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: teamKey(userId, organizationId) });
  const requireOrganization = () => {
    if (!organizationId) throw new Error('Selecciona una organización.');
    return organizationId;
  };

  return { api, invalidate, requireOrganization };
}

/** Invitación personal: correo + rol. Devuelve el código que usará solo ese correo (vence en 7 días). */
export function useCreatePersonalInvite() {
  const { api, invalidate, requireOrganization } = useTeamMutationContext();

  return useMutation({
    // POST /organizaciones/{organizacionId}/invitaciones
    mutationFn: async (input: PersonalInviteInput): Promise<InvitationCode> => {
      const created = personalInvitationCreatedSchema.parse(
        await api<unknown>(`/organizaciones/${requireOrganization()}/invitaciones`, {
          method: 'POST',
          body: personalInviteSchema.parse(input),
        }),
      );
      return { codigo: created.token, rol: created.rol, expiraEn: created.expiraEn };
    },
    onSuccess: invalidate,
  });
}

/** Código genérico: rol + vigencia en minutos. Cualquier persona con el código se une con ese rol. */
export function useCreateGenericCode() {
  const { api, requireOrganization } = useTeamMutationContext();

  return useMutation({
    // POST /organizaciones/{organizacionId}/codigos-invitacion
    mutationFn: async (input: GenericCodeInput) =>
      invitationCodeSchema.parse(
        await api<unknown>(`/organizaciones/${requireOrganization()}/codigos-invitacion`, {
          method: 'POST',
          body: genericCodeSchema.parse(input),
        }),
      ),
  });
}

/** Renueva la vigencia de una invitación personal pendiente. */
export function useResendInvitation() {
  const { api, invalidate } = useTeamMutationContext();

  return useMutation({
    // POST /invitaciones/{invitacionId}/reenviar
    mutationFn: async (invitationId: string) =>
      teamInvitationSchema.parse(
        await api<unknown>(`/invitaciones/${invitationId}/reenviar`, { method: 'POST' }),
      ),
    onSuccess: invalidate,
  });
}

const memberKey = (
  userId: string | null | undefined,
  organizationId: string | undefined,
  memberId: string | undefined,
) => ['member', userId, organizationId, memberId] as const;

/**
 * Perfil de un miembro: identidad, rol, estado e ingreso vienen del backend; la credencial digital
 * y las métricas son datos de ejemplo hasta que existan asistencia y tareas.
 */
export function useMemberProfile(memberId: string | undefined) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const organizationId = organization?.id;

  return useQuery({
    queryKey: memberKey(userId, organizationId, memberId),
    // GET /organizaciones/{organizacionId}/miembros/{miembroId}
    queryFn: async () => {
      const profile = memberProfileSchema.parse(
        await api<unknown>(`/organizaciones/${organizationId}/miembros/${memberId}`),
      );
      return { profile, sample: memberSampleSchema.parse(mockMemberSample(profile.id)) };
    },
    enabled: !!userId && !!organizationId && !!memberId,
  });
}

/** Cambia el rol de un miembro (solo ADMIN). El cambio es inmediato. */
export function useChangeMemberRole() {
  const { api, invalidate, requireOrganization } = useTeamMutationContext();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    // PATCH /organizaciones/{organizacionId}/miembros/{miembroId}
    mutationFn: async ({ memberId, rol }: { memberId: string } & ChangeRoleInput) =>
      memberProfileSchema.parse(
        await api<unknown>(`/organizaciones/${requireOrganization()}/miembros/${memberId}`, {
          method: 'PATCH',
          body: { rol },
        }),
      ),
    onSuccess: async (_member, { memberId }) => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: memberKey(userId, requireOrganization(), memberId) }),
      ]);
    },
  });
}

/** Quita a un miembro del equipo (solo ADMIN): pierde el acceso y se conserva su historial. */
export function useRemoveMember() {
  const { api, invalidate, requireOrganization } = useTeamMutationContext();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    // DELETE /organizaciones/{organizacionId}/miembros/{miembroId}
    mutationFn: async (memberId: string) => {
      await api<void>(`/organizaciones/${requireOrganization()}/miembros/${memberId}`, { method: 'DELETE' });
      return memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.removeQueries({ queryKey: memberKey(userId, requireOrganization(), memberId) });
      await invalidate();
    },
  });
}
