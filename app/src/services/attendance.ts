import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  mockAttendanceToday,
  mockDeleteShift,
  mockRegisterMovement,
  mockSaveShift,
  mockShiftsConfig,
} from '@/mocks/attendance';
import {
  attendanceTodaySchema,
  shiftsConfigSchema,
  type ShiftFormInput,
} from '@/schemas/attendance.schema';
import { shiftHours } from '@/utils/attendance';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';

import { useApiClient } from './api-client';

// Capa de servicio de «Asistencia» y «Configuración de turnos». Mientras no exista el backend, la
// jornada y las plantillas son de ejemplo (con la forma de los contratos de api/openapi.yaml); el
// personal que aparece en las plantillas sale del equipo real.

const attendanceKey = (userId: string | null | undefined, organizationId: string | undefined) =>
  ['attendance', 'today', userId, organizationId] as const;

/** Jornada de hoy: turno, estado y movimientos. */
export function useAttendanceToday() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: attendanceKey(userId, organization?.id),
    // Backend: GET /asistencia/hoy?organizacionId=… (JornadaAsistencia; el turno es proyectado)
    queryFn: async () => attendanceTodaySchema.parse(mockAttendanceToday(userId!)),
    enabled: !!userId && !!organization?.id,
  });
}

/** Registra una entrada/retorno (con QR) o una salida/pausa sobre la jornada de hoy. */
export function useRegisterMovement() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useMutation({
    // Backend: POST /asistencia/entrada (ENTRADA) · POST /asistencia/salida (SALIDA)
    mutationFn: async ({ tipo, token }: { tipo: 'ENTRADA' | 'SALIDA'; token?: string }) =>
      attendanceTodaySchema.parse(mockRegisterMovement(userId!, tipo, token)),
    onSuccess: (data) => queryClient.setQueryData(attendanceKey(userId, organization?.id), data),
  });
}

const shiftsKey = (userId: string | null | undefined, organizationId: string | undefined) =>
  ['shifts', userId, organizationId] as const;

/** Miembros reales del equipo (hasta 100): son las personas asignables a un turno. */
function useTeamSample() {
  const api = useApiClient();
  const { organization } = useActiveOrganization();

  // GET /organizaciones/{organizacionId}/equipo
  return async () => {
    const page = teamPageSchema.parse(
      await api<unknown>(`/organizaciones/${organization!.id}/equipo?filtro=TODOS&page=1&pageSize=100`),
    );
    return page.items.filter((item): item is TeamMember => item.tipo === 'MIEMBRO' && item.estado === 'ACTIVO');
  };
}

/** Miembros activos que se pueden asignar a una plantilla. */
export function useAssignableMembers() {
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();
  const fetchMembers = useTeamSample();

  return useQuery({
    queryKey: ['shifts', 'members', userId, organization?.id],
    queryFn: fetchMembers,
    enabled: !!userId && !!organization?.id && canManageTeam,
  });
}

/** Plantillas de turno de la organización (solo ADMIN). */
export function useShiftsConfig() {
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();
  const fetchMembers = useTeamSample();

  return useQuery({
    queryKey: shiftsKey(userId, organization?.id),
    // Backend (proyectado): GET /organizaciones/{organizacionId}/turnos
    queryFn: async () => shiftsConfigSchema.parse(mockShiftsConfig(organization!.id, await fetchMembers())),
    enabled: !!userId && !!organization?.id && canManageTeam,
  });
}

/** Una plantilla de la configuración (`undefined` si ya no existe). */
export function useShiftTemplate(shiftId: string | undefined) {
  const query = useShiftsConfig();
  return { ...query, template: query.data?.plantillas.find((template) => template.id === shiftId) };
}

/** Crea (sin `id`) o actualiza una plantilla de turno. */
export function useSaveShift() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const fetchMembers = useTeamSample();

  return useMutation({
    // Backend (proyectado): POST /organizaciones/{organizacionId}/turnos · PATCH …/turnos/{turnoId}
    mutationFn: async ({ id, form }: { id?: string; form: ShiftFormInput }) =>
      shiftsConfigSchema.parse(
        mockSaveShift(
          organization!.id,
          await fetchMembers(),
          { ...form, horas: shiftHours(form.horaInicio, form.horaFin) },
          id,
        ),
      ),
    onSuccess: (data) => queryClient.setQueryData(shiftsKey(userId, organization?.id), data),
  });
}

/** Elimina una plantilla de turno. */
export function useDeleteShift() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const fetchMembers = useTeamSample();

  return useMutation({
    // Backend (proyectado): DELETE /organizaciones/{organizacionId}/turnos/{turnoId}
    mutationFn: async (id: string) =>
      shiftsConfigSchema.parse(mockDeleteShift(organization!.id, await fetchMembers(), id)),
    onSuccess: (data) => queryClient.setQueryData(shiftsKey(userId, organization?.id), data),
  });
}
