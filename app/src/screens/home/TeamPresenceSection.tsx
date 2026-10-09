import React from 'react';
import { View } from 'react-native';

import { PresenceCard, RecentAttendance, SectionHeader, WeeklyPunctuality } from '@/components/home';
import { MembershipsState } from '@/components/organizations';
import type { AdminHome } from '@/schemas/home.schema';

interface TeamPresenceSectionProps {
  panel: { data?: AdminHome; isPending: boolean; isError: boolean; error: Error | null; refetch: () => void };
  /** Solo el ADMIN tiene el reporte de horas. */
  onOpenReport?: () => void;
}

/** Presencia de hoy, puntualidad semanal y últimas entradas del equipo (ADMIN y SUPERVISOR). */
export const TeamPresenceSection: React.FC<TeamPresenceSectionProps> = ({ panel, onOpenReport }) => {
  if (panel.isPending) return <MembershipsState status="loading" loadingText="Cargando la presencia del equipo…" />;
  if (panel.isError || !panel.data) {
    return (
      <MembershipsState
        status="error"
        errorTitle="No pudimos cargar la presencia del equipo"
        message={panel.error?.message}
        onRetry={() => panel.refetch()}
      />
    );
  }

  return (
    <>
      <View className="gap-4">
        <SectionHeader
          title="Equipo hoy"
          action={onOpenReport ? { label: 'Reporte de horas', onPress: onOpenReport } : undefined}
        />
        <PresenceCard presencia={panel.data.presencia} />
      </View>
      <WeeklyPunctuality semana={panel.data.puntualidadSemanal} />
      <RecentAttendance records={panel.data.asistenciasRecientes} onSeeAll={onOpenReport} />
    </>
  );
};
