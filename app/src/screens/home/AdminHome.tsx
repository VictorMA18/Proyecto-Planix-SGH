import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  ActiveTimeCard,
  AttendanceQrCard,
  ComingSoonDialog,
  HomeGreeting,
  OrgTasksCard,
  QuickActions,
  ShiftChip,
} from '@/components/home';
import { COMING_SOON, type ComingSoonFeature } from '@/constants/home';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useEmployeeHome, useHomeTasks, useTeamPanel } from '@/services/home';

import { TeamPresenceSection } from './TeamPresenceSection';

/** Inicio de ADMIN: su propia jornada, el QR dinámico y el panel del equipo. */
export const AdminHome: React.FC = () => {
  const router = useRouter();
  const user = useUserDisplay();
  const { organization } = useActiveOrganization();
  const panel = useTeamPanel();
  // El administrador también marca asistencia: su jornada es la misma que la de los demás roles.
  const shift = useEmployeeHome();
  const tasks = useHomeTasks();
  const [feature, setFeature] = useState<ComingSoonFeature | null>(null);
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
          onNewTask={() => setFeature(COMING_SOON.newTask)}
          onBroadcast={() => setFeature(COMING_SOON.broadcast)}
        />

        <TeamPresenceSection panel={panel} onOpenReport={() => router.push('/reportes')} />

        {tasks.data ? (
          <View className="gap-4">
            <OrgTasksCard tareas={tasks.data.organizacion} />
          </View>
        ) : null}
      </ScrollView>

      <ComingSoonDialog feature={feature} onClose={() => setFeature(null)} />
    </View>
  );
};
