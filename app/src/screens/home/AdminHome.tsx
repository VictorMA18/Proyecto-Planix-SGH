import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  ActiveTimeCard,
  AttendanceQrCard,
  HomeGreeting,
  OrgTasksCard,
  TodayTasks,
  QuickActions,
  ShiftChip,
} from '@/components/home';
import { BroadcastSheet } from '@/components/notifications';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useNow } from '@/hooks/use-now';
import { useEmployeeHome, useTeamPanel } from '@/services/home';
import { useSetTaskStatus } from '@/services/tasks';

import { TeamPresenceSection } from './TeamPresenceSection';

/** Inicio de ADMIN: su propia jornada, el QR dinámico y el panel del equipo. */
export const AdminHome: React.FC = () => {
  const router = useRouter();
  const user = useUserDisplay();
  const { organization } = useActiveOrganization();
  const panel = useTeamPanel();
  // El administrador también marca asistencia: su jornada es la misma que la de los demás roles.
  const shift = useEmployeeHome();
  const setStatus = useSetTaskStatus();
  const now = useNow(60_000);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const organizationName = organization?.nombre ?? 'tu organización';

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
              void panel.refetch();
              void shift.refetch();
            }}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <HomeGreeting firstName={user.firstName}>
          <Text className="text-sm text-neutral-muted">Panel de control de {organizationName}</Text>
          {shift.data ? <ShiftChip turno={shift.data.turno} /> : null}
        </HomeGreeting>

        {shift.data ? <ActiveTimeCard home={shift.data} /> : null}

        {panel.data?.qr ? (
          <AttendanceQrCard
            qr={panel.data.qr}
            organizationName={organizationName}
            onExpired={() => void panel.refetch()}
          />
        ) : null}

        <QuickActions
          onNewTask={() => router.push('/tarea/nueva')}
          onBroadcast={() => setBroadcastOpen(true)}
        />

        <TeamPresenceSection panel={panel} onOpenReport={() => router.push('/reportes')} />

        {panel.data ? <OrgTasksCard tareas={panel.data.tareasOrganizacion} /> : null}

        {shift.data ? (
          <TodayTasks
            tasks={shift.data.tareas.hoy}
            now={now}
            busy={setStatus.isPending}
            onOpen={(task) => router.push(`/tarea/${task.id}`)}
            onToggleDone={(task) =>
              setStatus.mutate({ taskId: task.id, estado: task.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA' })
            }
            onSeeAll={() => router.push('/tareas')}
          />
        ) : null}
      </ScrollView>

      <BroadcastSheet visible={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </View>
  );
};
