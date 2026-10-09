import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import { mockAdminHome, mockEmployeeHome } from '@/mocks/home';
import { adminHomeSchema, employeeHomeSchema } from '@/schemas/home.schema';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';

import { useApiClient } from './api-client';

// Capa de servicio de la pestaña «Inicio». Los datos de asistencia, métricas y tareas son de ejemplo
// (con la forma de los contratos proyectados en api/openapi.yaml); los compañeros y el número de
// miembros esperados son reales, porque salen del equipo de la organización.

const homeKey = (kind: string, userId: string | null | undefined, organizationId: string | undefined) =>
  ['home', kind, userId, organizationId] as const;

/** InicioEmpleado: jornada de hoy, métricas de la semana y tareas de hoy (EMPLEADO y SUPERVISOR). */
export function useEmployeeHome() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('employee', userId, organization?.id),
    // Backend (proyectado): GET /organizaciones/{organizacionId}/inicio/mio
    queryFn: async () => employeeHomeSchema.parse(mockEmployeeHome(userId!)),
    enabled: !!userId && !!organization?.id,
  });
}

/** Miembros activos de la organización (reales) y cuántos se esperan en total. */
function useTeamMembers() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('team', userId, organization?.id),
    // GET /organizaciones/{organizacionId}/equipo
    queryFn: async () => {
      const page = teamPageSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/equipo?filtro=TODOS&page=1&pageSize=12`),
      );
      const members = page.items.filter((item): item is TeamMember => item.tipo === 'MIEMBRO');
      return { members, expected: page.conteos.todos - page.conteos.pendientes };
    },
    enabled: !!userId && !!organization?.id,
  });
}

/** Compañeros en turno: miembros reales de la organización (la presencia es de ejemplo). */
export function useOnShiftColleagues() {
  const { membership } = useActiveOrganization();
  const team = useTeamMembers();

  return {
    ...team,
    data: team.data?.members.filter((member) => member.id !== membership?.id).slice(0, 6),
  };
}

/** PanelAdmin: presencia, tareas, puntualidad semanal y asistencias recientes (solo ADMIN). */
export function useAdminHome() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const team = useTeamMembers();

  const panel = useQuery({
    queryKey: [...homeKey('admin', userId, organization?.id), team.data?.expected, team.data?.members.length],
    // Backend (proyectado): GET /organizaciones/{organizacionId}/inicio/panel
    queryFn: async () =>
      adminHomeSchema.parse(
        mockAdminHome(
          organization!.id,
          Math.max(1, team.data!.expected),
          team.data!.members.map((m) => ({ id: m.id, nombre: m.nombre })),
        ),
      ),
    enabled: !!userId && !!organization?.id && !!team.data,
  });

  // Un error al cargar el equipo (de donde salen los números reales) también es un error del panel.
  return {
    data: panel.data,
    isPending: !team.isError && panel.isPending,
    isError: team.isError || panel.isError,
    errorMessage: (team.error ?? panel.error)?.message,
    isRefetching: panel.isRefetching || team.isRefetching,
    refetch: () => {
      void team.refetch();
      void panel.refetch();
    },
  };
}
