import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import { mockHomeTasks } from '@/mocks/home-tasks';
import { adminHomeSchema, employeeHomeSchema, homeTasksSchema } from '@/schemas/home.schema';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';

import { useApiClient } from './api-client';

// Capa de servicio de la pestaña «Inicio». La jornada, la semana y el panel vienen de la API
// (Fase 2); las tareas son de ejemplo hasta la Fase 3.

const homeKey = (kind: string, userId: string | null | undefined, organizationId: string | undefined) =>
  ['home', kind, userId, organizationId] as const;

/** InicioEmpleado: turno, jornada de hoy y semana (todos los roles). */
export function useEmployeeHome() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('mine', userId, organization?.id),
    // GET /organizaciones/{organizacionId}/inicio/mio
    queryFn: async () =>
      employeeHomeSchema.parse(await api<unknown>(`/organizaciones/${organization!.id}/inicio/mio`)),
    enabled: !!userId && !!organization?.id,
  });
}

/** PanelAdmin: presencia del equipo, puntualidad semanal y asistencias recientes (ADMIN y SUPERVISOR). */
export function useTeamPanel(enabled = true) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('panel', userId, organization?.id),
    // GET /organizaciones/{organizacionId}/inicio/panel
    queryFn: async () =>
      adminHomeSchema.parse(await api<unknown>(`/organizaciones/${organization!.id}/inicio/panel`)),
    enabled: enabled && !!userId && !!organization?.id,
  });
}

/** Tareas de hoy y avance semanal (ejemplo). */
export function useHomeTasks() {
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('tasks', userId, organization?.id),
    // Backend (proyectado, Fase 3): tareas de Inicio con la forma de TareaInicio
    queryFn: async () => homeTasksSchema.parse(mockHomeTasks(userId!, organization!.id)),
    enabled: !!userId && !!organization?.id,
  });
}

/** Compañeros: miembros activos reales de la organización (sin el propio usuario). */
export function useOnShiftColleagues() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization, membership } = useActiveOrganization();

  return useQuery({
    queryKey: homeKey('team', userId, organization?.id),
    // GET /organizaciones/{organizacionId}/equipo
    queryFn: async () => {
      const page = teamPageSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/equipo?filtro=TODOS&page=1&pageSize=12`),
      );
      return page.items.filter((item): item is TeamMember => item.tipo === 'MIEMBRO');
    },
    select: (members) => members.filter((member) => member.id !== membership?.id).slice(0, 6),
    enabled: !!userId && !!organization?.id,
  });
}
