import { useAuth } from '@clerk/expo';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import { attendanceReportSchema, type ReportRange } from '@/schemas/report.schema';
import { reportRangeDates } from '@/utils/attendance';

import { useApiClient } from './api-client';

/** Reporte de horas y puntualidad por miembro (solo ADMIN). */
export function useAttendanceReport(range: ReportRange) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization, canManageTeam } = useActiveOrganization();
  const { desde, hasta } = reportRangeDates(range);

  return useQuery({
    queryKey: ['reports', 'attendance', userId, organization?.id, desde, hasta],
    // GET /organizaciones/{organizacionId}/reportes/asistencia?desde=…&hasta=…
    queryFn: async () =>
      attendanceReportSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/reportes/asistencia?desde=${desde}&hasta=${hasta}`),
      ),
    placeholderData: keepPreviousData,
    enabled: !!userId && !!organization?.id && canManageTeam,
  });
}
