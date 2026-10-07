import { useAuth } from '@clerk/expo';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TEAM_PAGE_SIZE } from '@/constants/team';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { mockTeamBackend } from '@/mocks/team';
import {
  genericCodeSchema,
  invitationCodeSchema,
  personalInviteSchema,
  teamInvitationSchema,
  teamPageSchema,
  type GenericCodeInput,
  type PersonalInviteInput,
  type TeamQuery,
} from '@/schemas/team.schema';

// Capa de servicio de «Equipo y Miembros». Hoy responde con `mocks/team.ts`, pero con la forma
// exacta (validada con Zod) de los endpoints proyectados en api/openapi.yaml: al implementarse el
// backend solo cambia el cuerpo de cada función por una llamada a `useApiClient()`.

const teamKey = (userId: string | null | undefined, organizationId: string | undefined) =>
  ['team', userId, organizationId] as const;

/** Equipo de la organización activa (miembros + invitaciones pendientes), con filtro y paginación. */
export function useTeam({ search, filter, page }: TeamQuery) {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const organizationId = organization?.id;

  return useQuery({
    queryKey: [...teamKey(userId, organizationId), { search, filter, page }],
    // Backend: GET /organizaciones/{organizacionId}/equipo?q&filtro&page&pageSize
    queryFn: async () =>
      teamPageSchema.parse(
        await mockTeamBackend.list(organizationId!, { search, filter, page, pageSize: TEAM_PAGE_SIZE }),
      ),
    enabled: !!userId && !!organizationId,
    placeholderData: keepPreviousData,
  });
}

function useTeamMutationContext() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const queryClient = useQueryClient();

  const organizationId = organization?.id;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: teamKey(userId, organizationId) });
  const requireOrganization = () => {
    if (!organizationId) throw new Error('Selecciona una organización.');
    return organizationId;
  };

  return { invalidate, requireOrganization };
}

/** Invitación personal: correo + rol. Devuelve el código que usará solo ese correo. */
export function useCreatePersonalInvite() {
  const { invalidate, requireOrganization } = useTeamMutationContext();

  return useMutation({
    // Backend: POST /organizaciones/{organizacionId}/invitaciones
    mutationFn: async (input: PersonalInviteInput) =>
      invitationCodeSchema.parse(
        await mockTeamBackend.createPersonalInvitation(requireOrganization(), personalInviteSchema.parse(input)),
      ),
    onSuccess: invalidate,
  });
}

/** Código genérico: rol + vigencia. Cualquier persona con el código se une con ese rol. */
export function useCreateGenericCode() {
  const { requireOrganization } = useTeamMutationContext();

  return useMutation({
    // Backend (proyectado): POST /organizaciones/{organizacionId}/codigos-invitacion
    mutationFn: async (input: GenericCodeInput) =>
      invitationCodeSchema.parse(
        await mockTeamBackend.createGenericCode(requireOrganization(), genericCodeSchema.parse(input)),
      ),
  });
}

export function useResendInvitation() {
  const { invalidate, requireOrganization } = useTeamMutationContext();

  return useMutation({
    // Backend (proyectado): POST /invitaciones/{invitacionId}/reenviar
    mutationFn: async (invitationId: string) =>
      teamInvitationSchema.parse(await mockTeamBackend.resendInvitation(requireOrganization(), invitationId)),
    onSuccess: invalidate,
  });
}
