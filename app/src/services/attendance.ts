import { useAuth } from '@clerk/expo';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  attendanceTodaySchema,
  journeyPageSchema,
  journeySchema,
  shiftsConfigSchema,
  shiftTemplateSchema,
  type ShiftFormInput,
} from '@/schemas/attendance.schema';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';

import { useApiClient } from './api-client';

// Capa de servicio de «Asistencia» y «Configuración de turnos» (Fase 2, contra la API real).

const HISTORY_PAGE_SIZE = 15;

/** Claves de TanStack Query: incluyen usuario y organización para no mezclar cuentas. */
export const attendanceKeys = {
  today: (userId: string | null | undefined, orgId: string | undefined) =>
    ['attendance', 'today', userId, orgId] as const,
  history: (userId: string | null | undefined, orgId: string | undefined) =>
    ['attendance', 'history', userId, orgId] as const,
  shifts: (userId: string | null | undefined, orgId: string | undefined) =>
    ['shifts', userId, orgId] as const,
};

/** Turno de hoy, tolerancia y jornada en curso. */
export function useAttendanceToday() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: attendanceKeys.today(userId, organization?.id),
    // GET /asistencia/hoy?organizacionId=…
    queryFn: async () =>
      attendanceTodaySchema.parse(await api<unknown>(`/asistencia/hoy?organizacionId=${organization!.id}`)),
    enabled: !!userId && !!organization?.id,
  });
}

/** Tras un movimiento cambian la jornada, el Inicio (propio y el panel) y el historial. */
function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['attendance'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
    ]);
}

/** Entrada o retorno con el texto leído del QR (la organización sale del propio QR). */
export function useRegisterEntry() {
  const api = useApiClient();
  const invalidate = useInvalidateAttendance();

  return useMutation({
    // POST /asistencia/entrada
    mutationFn: async (token: string) =>
      journeySchema.parse(await api<unknown>('/asistencia/entrada', { method: 'POST', body: { token } })),
    onSuccess: invalidate,
  });
}

/** Salida (intermedia o final); la hora la pone el servidor. */
export function useRegisterExit() {
  const api = useApiClient();
  const { organization } = useActiveOrganization();
  const invalidate = useInvalidateAttendance();

  return useMutation({
    // POST /asistencia/salida
    mutationFn: async () =>
      journeySchema.parse(
        await api<unknown>('/asistencia/salida', {
          method: 'POST',
          body: { organizacionId: organization!.id },
        }),
      ),
    onSuccess: invalidate,
  });
}

/** Historial de jornadas propias, paginado (scroll infinito). */
export function useAttendanceHistory() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useInfiniteQuery({
    queryKey: attendanceKeys.history(userId, organization?.id),
    initialPageParam: 1,
    // GET /asistencia/historial?organizacionId=…&page=…&pageSize=…
    queryFn: async ({ pageParam }) =>
      journeyPageSchema.parse(
        await api<unknown>(
          `/asistencia/historial?organizacionId=${organization!.id}&page=${pageParam}&pageSize=${HISTORY_PAGE_SIZE}`,
        ),
      ),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    enabled: !!userId && !!organization?.id,
  });
}

/** Miembros activos que se pueden asignar a una plantilla (hasta 100). */
export function useAssignableMembers() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();

  return useQuery({
    queryKey: ['shifts', 'members', userId, organization?.id],
    // GET /organizaciones/{organizacionId}/equipo
    queryFn: async () => {
      const page = teamPageSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/equipo?filtro=TODOS&page=1&pageSize=100`),
      );
      return page.items.filter((item): item is TeamMember => item.tipo === 'MIEMBRO' && item.estado === 'ACTIVO');
    },
    enabled: !!userId && !!organization?.id && canManageTeam,
  });
}

/** Plantillas de turno, personal cubierto y tolerancia (solo ADMIN). */
export function useShiftsConfig() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();

  return useQuery({
    queryKey: attendanceKeys.shifts(userId, organization?.id),
    // GET /organizaciones/{organizacionId}/turnos
    queryFn: async () =>
      shiftsConfigSchema.parse(await api<unknown>(`/organizaciones/${organization!.id}/turnos`)),
    enabled: !!userId && !!organization?.id && canManageTeam,
  });
}

/** Una plantilla de la configuración (`undefined` si ya no existe). */
export function useShiftTemplate(shiftId: string | undefined) {
  const query = useShiftsConfig();
  return { ...query, template: query.data?.plantillas.find((template) => template.id === shiftId) };
}

/** Los turnos cambian la jornada esperada: se recargan la configuración y el Inicio. */
function useInvalidateShifts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['shifts'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] }),
    ]);
}

/** Crea (sin `id`) o actualiza una plantilla y su equipo asignado. */
export function useSaveShift() {
  const api = useApiClient();
  const { organization } = useActiveOrganization();
  const invalidate = useInvalidateShifts();

  return useMutation({
    // POST /organizaciones/{organizacionId}/turnos · PATCH …/turnos/{turnoId}
    mutationFn: async ({ id, form }: { id?: string; form: ShiftFormInput }) =>
      shiftTemplateSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/turnos${id ? `/${id}` : ''}`, {
          method: id ? 'PATCH' : 'POST',
          body: form,
        }),
      ),
    onSuccess: invalidate,
  });
}

/** Elimina una plantilla; sus miembros quedan sin turno. */
export function useDeleteShift() {
  const api = useApiClient();
  const { organization } = useActiveOrganization();
  const invalidate = useInvalidateShifts();

  return useMutation({
    // DELETE /organizaciones/{organizacionId}/turnos/{turnoId}
    mutationFn: async (id: string) => {
      await api<void>(`/organizaciones/${organization!.id}/turnos/${id}`, { method: 'DELETE' });
    },
    onSuccess: invalidate,
  });
}

/** Cambia la tolerancia de entrada de la organización. */
export function useUpdateTolerance() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const invalidate = useInvalidateShifts();

  return useMutation({
    // PATCH /organizaciones/{organizacionId}/turnos/tolerancia
    mutationFn: async (toleranciaMin: number) =>
      shiftsConfigSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/turnos/tolerancia`, {
          method: 'PATCH',
          body: { toleranciaMin },
        }),
      ),
    onSuccess: async (data) => {
      queryClient.setQueryData(attendanceKeys.shifts(userId, organization?.id), data);
      await invalidate();
    },
  });
}
