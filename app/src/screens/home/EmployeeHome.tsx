import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { MembershipsState } from '@/components/organizations';
import {
  ActiveTimeCard,
  ComingSoonDialog,
  HomeGreeting,
  OnShiftColleagues,
  QuickActions,
  SampleNotice,
  ShiftChip,
  TodayTasks,
  WeeklyMetrics,
} from '@/components/home';
import { COMING_SOON, type ComingSoonFeature } from '@/constants/home';
import { ThemeColors } from '@/constants/theme';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useEmployeeHome, useOnShiftColleagues } from '@/services/home';

interface EmployeeHomeProps {
  /** El supervisor ve «Nueva tarea» y «Difundir aviso» bajo el tiempo activo. */
  showQuickActions: boolean;
}

/** Inicio de EMPLEADO y SUPERVISOR: jornada de hoy, métricas de la semana, tareas y compañeros. */
export const EmployeeHome: React.FC<EmployeeHomeProps> = ({ showQuickActions }) => {
  const user = useUserDisplay();
  const home = useEmployeeHome();
  const colleagues = useOnShiftColleagues();
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
            }}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <HomeGreeting firstName={user.firstName}>
          {home.data ? <ShiftChip turno={home.data.turno} /> : null}
        </HomeGreeting>

        <SampleNotice />

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
            <ActiveTimeCard turno={home.data.turno} estado={home.data.estado} entrada={home.data.entrada} />

            {showQuickActions ? (
              <QuickActions
                onNewTask={() => setFeature(COMING_SOON.newTask)}
                onBroadcast={() => setFeature(COMING_SOON.broadcast)}
              />
            ) : null}

            <WeeklyMetrics semana={home.data.semana} onSeeReport={() => setFeature(COMING_SOON.report)} />
            <TodayTasks tasks={home.data.tareasHoy} />
            <OnShiftColleagues
              colleagues={colleagues.data}
              isPending={colleagues.isPending}
              isError={colleagues.isError}
            />
          </>
        )}
      </ScrollView>

      <ComingSoonDialog feature={feature} onClose={() => setFeature(null)} />
    </View>
  );
};
