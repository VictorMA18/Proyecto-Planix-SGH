import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { MembershipsState } from '@/components/organizations';
import {
  ActiveTimeCard,
  AttendanceQrCard,
  ComingSoonDialog,
  HomeGreeting,
  OrgTasksCard,
  PresenceCard,
  QuickActions,
  RecentAttendance,
  SampleNotice,
  SectionHeader,
  ShiftChip,
  WeeklyPunctuality,
} from '@/components/home';
import { COMING_SOON, type ComingSoonFeature } from '@/constants/home';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useAdminHome, useEmployeeHome } from '@/services/home';

/** Inicio de ADMIN: su propia jornada (tiempo activo) y el panel de control de la organización. */
export const AdminHome: React.FC = () => {
  const user = useUserDisplay();
  const { organization } = useActiveOrganization();
  const panel = useAdminHome();
  // El administrador también trabaja turnos: su jornada es la misma que la de los demás roles.
  const shift = useEmployeeHome();
  const [feature, setFeature] = useState<ComingSoonFeature | null>(null);

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={panel.isRefetching}
            onRefresh={() => {
              panel.refetch();
              void shift.refetch();
            }}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <HomeGreeting firstName={user.firstName}>
          <Text className="text-sm text-neutral-muted">
            Panel de control de {organization?.nombre ?? 'tu organización'}
          </Text>
          {shift.data ? <ShiftChip turno={shift.data.turno} /> : null}
        </HomeGreeting>

        <SampleNotice />

        {shift.data ? (
          <ActiveTimeCard turno={shift.data.turno} estado={shift.data.estado} entrada={shift.data.entrada} />
        ) : null}

        {panel.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando el panel…" />
        ) : panel.isError || !panel.data ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar el panel"
            message={panel.errorMessage}
            onRetry={panel.refetch}
          />
        ) : (
          <>
            <AttendanceQrCard
              expiresAt={panel.data.qr.expiraEn}
              onProject={() => setFeature(COMING_SOON.project)}
              onExpired={panel.refetch}
            />

            <QuickActions
              onNewTask={() => setFeature(COMING_SOON.newTask)}
              onBroadcast={() => setFeature(COMING_SOON.broadcast)}
            />

            <View className="gap-4">
              <SectionHeader
                title="Métricas en Directo"
                action={{ label: 'Ver historial', onPress: () => setFeature(COMING_SOON.history) }}
              />
              <PresenceCard presencia={panel.data.presencia} />
              <OrgTasksCard tareas={panel.data.tareasOrganizacion} />
            </View>

            <WeeklyPunctuality semana={panel.data.puntualidadSemanal} />

            <RecentAttendance
              records={panel.data.asistenciasRecientes}
              onSeeAll={() => setFeature(COMING_SOON.history)}
            />
          </>
        )}
      </ScrollView>

      <ComingSoonDialog feature={feature} onClose={() => setFeature(null)} />
    </View>
  );
};
