import { useAuth } from '@clerk/expo';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { COLLABORATORS_PAGE_SIZE } from '@/constants/metrics';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { collaboratorsPageSchema, metricsPeriodSchema, type PeriodType } from '@/schemas/metrics.schema';

import { useApiClient } from './api-client';

// Capa de servicio de la pestaña «Métricas»: llama a la API y valida cada respuesta con Zod.

export const metricsKeys = {
  all: ['metrics'] as const,
  period: (userId: string | null | undefined, orgId: string | undefined, type: PeriodType, date: string, memberId: string | null) =>
    ['metrics', 'period', userId, orgId, type, date, memberId] as const,
  collaborators: (
    userId: string | null | undefined,
    orgId: string | undefined,
    type: PeriodType,
    date: string,
    search: string,
    page: number,
  ) => ['metrics', 'collaborators', userId, orgId, type, date, search, page] as const,
};

/**
 * Métricas del periodo: del equipo (`memberId` = `null`, solo ADMIN) o de un miembro. Quien no es
 * ADMIN siempre pide las suyas.
 */
export function useMetrics(type: PeriodType, date: string, memberId: string | null) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: metricsKeys.period(userId, organization?.id, type, date, memberId),
    // GET /organizaciones/{organizacionId}/metricas?periodo&fecha&miembroId
    queryFn: async () => {
      const params = new URLSearchParams({ periodo: type, fecha: date });
      if (memberId) params.set('miembroId', memberId);
      return metricsPeriodSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/metricas?${params.toString()}`),
      );
    },
    enabled: !!userId && !!organization?.id,
    placeholderData: keepPreviousData,
  });
}

/** «Ver todos»: resumen de cada colaborador del periodo, con búsqueda y paginación (solo ADMIN). */
export function useCollaborators(type: PeriodType, date: string, search: string, page: number) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();

  return useQuery({
    queryKey: metricsKeys.collaborators(userId, organization?.id, type, date, search, page),
    // GET /organizaciones/{organizacionId}/metricas/colaboradores?periodo&fecha&q&page&pageSize
    queryFn: async () => {
      const params = new URLSearchParams({
        periodo: type,
        fecha: date,
        page: String(page),
        pageSize: String(COLLABORATORS_PAGE_SIZE),
      });
      if (search.trim()) params.set('q', search.trim());
      return collaboratorsPageSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/metricas/colaboradores?${params.toString()}`),
      );
    },
    enabled: !!userId && !!organization?.id && canManageTeam,
    placeholderData: keepPreviousData,
  });
}
