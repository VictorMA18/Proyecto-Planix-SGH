import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SampleNotice } from '@/components/home';
import { MembershipsState } from '@/components/organizations';
import { DeleteShiftModal, ShiftActionsMenu, ShiftSummary, ShiftTemplateCard } from '@/components/shifts';
import { AppButton, ScreenHeader } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import type { ShiftTemplate } from '@/schemas/attendance.schema';
import { useShiftsConfig } from '@/services/attendance';

export default function ShiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization, canManageTeam, isPending: orgPending } = useActiveOrganization();
  const shifts = useShiftsConfig();
  const [menuFor, setMenuFor] = useState<ShiftTemplate | null>(null);
  const [deleting, setDeleting] = useState<ShiftTemplate | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Configuración de turnos" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={shifts.isRefetching}
            onRefresh={() => shifts.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        {orgPending ? (
          <MembershipsState status="loading" loadingText="Cargando tu organización…" />
        ) : !canManageTeam ? (
          <MembershipsState
            status="empty"
            emptyTitle="Solo para administradores"
            emptyMessage="La configuración de turnos está disponible únicamente para los administradores de la organización."
          />
        ) : (
          <>
            <View
              style={{ borderCurve: 'continuous' }}
              className="w-full bg-cardBg rounded-3xl p-5 shadow-lg shadow-primary/10 gap-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-tertiary items-center justify-center">
                  <Ionicons name="calendar-outline" size={24} color={ThemeColors.primary} />
                </View>
                <Text className="flex-1 text-sm text-neutral-muted">
                  Reglas de horarios, plantillas y control de asistencia en{' '}
                  <Text className="font-bold text-neutral">{organization?.nombre ?? 'tu organización'}</Text>.
                </Text>
              </View>
              <AppButton
                title="Crear nueva plantilla de turno"
                icon="add-circle-outline"
                onPress={() => router.push('/turnos/nuevo')}
              />
            </View>

            <SampleNotice />

            {shifts.isPending ? (
              <MembershipsState status="loading" loadingText="Cargando los turnos…" />
            ) : shifts.isError ? (
              <MembershipsState
                status="error"
                errorTitle="No pudimos cargar los turnos"
                message={shifts.error.message}
                onRetry={() => shifts.refetch()}
              />
            ) : (
              <>
                <ShiftSummary resumen={shifts.data.resumen} />
                {shifts.data.plantillas.map((template, index) => (
                  <ShiftTemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    onEdit={() => router.push(`/turnos/${template.id}/editar`)}
                    onMore={() => setMenuFor(template)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <ShiftActionsMenu
        template={menuFor}
        onClose={() => setMenuFor(null)}
        onViewDetail={(template) => {
          setMenuFor(null);
          router.push(`/turnos/${template.id}`);
        }}
        onDelete={(template) => {
          setMenuFor(null);
          setDeleting(template);
        }}
      />
      <DeleteShiftModal template={deleting} onClose={() => setDeleting(null)} />
    </SafeAreaView>
  );
}
