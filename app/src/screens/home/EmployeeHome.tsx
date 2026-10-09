import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  ActiveTimeCard,
  ComingSoonDialog,
  HomeGreeting,
  OnShiftColleagues,
  QuickActions,
  ShiftChip,
  TodayTasks,
  WeeklyMetrics,
} from '@/components/home';
import { MembershipsState } from '@/components/organizations';
import { COMING_SOON, type ComingSoonFeature } from '@/constants/home';
import { ThemeColors } from '@/constants/theme';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useEmployeeHome, useHomeTasks, useOnShiftColleagues, useTeamPanel } from '@/services/home';

import { TeamPresenceSection } from './TeamPresenceSection';

interface EmployeeHomeProps {
  /** El supervisor ve los accesos rápidos y la presencia del equipo (sin QR). */
  isSupervisor: boolean;
}

/** Inicio de EMPLEADO y SUPERVISOR: jornada real de hoy, semana, tareas (ejemplo) y equipo. */
export const EmployeeHome: React.FC<EmployeeHomeProps> = ({ isSupervisor }) => {
  const router = useRouter();
  const user = useUserDisplay();
  const home = useEmployeeHome();
  const tasks = useHomeTasks();
  const colleagues = useOnShiftColleagues();
  const panel = useTeamPanel(isSupervisor);
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
            refreshing={home.isRefetching}
            onRefresh={() => {
              void home.refetch();
              void colleagues.refetch();
              if (isSupervisor) void panel.refetch();
            }}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <HomeGreeting firstName={user.firstName}>
          {home.data ? <ShiftChip turno={home.data.turno} /> : null}
        </HomeGreeting>

        {home.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando tu jornada…" />
        ) : home.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar tu jornada"
            message={home.error.message}
            onRetry={() => home.refetch()}
          />
        ) : (
          <>
            <ActiveTimeCard home={home.data} />

            {isSupervisor ? (
              <QuickActions
                onNewTask={() => setFeature(COMING_SOON.newTask)}
                onBroadcast={() => setFeature(COMING_SOON.broadcast)}
              />
            ) : null}

            <WeeklyMetrics
              semana={home.data.semana}
              tareas={tasks.data?.semana}
              onSeeHistory={() => router.push('/historial')}
            />
          </>
        )}

        {isSupervisor ? <TeamPresenceSection panel={panel} /> : null}

        {tasks.data ? <TodayTasks tasks={tasks.data.tareasHoy} /> : null}
        <OnShiftColleagues colleagues={colleagues.data} isPending={colleagues.isPending} isError={colleagues.isError} />
      </ScrollView>

      <ComingSoonDialog feature={feature} onClose={() => setFeature(null)} />
    </View>
  );
};
