import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SampleNotice } from '@/components/home';
import { MembershipsState } from '@/components/organizations';
import { DeleteShiftModal, WeekdayChips } from '@/components/shifts';
import { AppButton, ScreenHeader, UserAvatar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useShiftTemplate } from '@/services/attendance';
import { formatHours, formatShiftTime } from '@/utils/attendance';
import { getInitials } from '@/utils/format';

const Row: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <View className="flex-row items-center gap-3">
    <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center">
      <Ionicons name={icon} size={18} color={ThemeColors.primary} />
    </View>
    <View className="flex-1">
      <Text className="text-xs text-neutral-muted">{label}</Text>
      <Text className="text-base font-bold text-neutral">{children}</Text>
    </View>
  </View>
);

export default function ShiftDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { template, isPending, isError, error, refetch } = useShiftTemplate(turnoId);
  const [deleting, setDeleting] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Detalle del turno" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        showsVerticalScrollIndicator={false}
      >
        {isPending ? (
          <MembershipsState status="loading" loadingText="Cargando la plantilla…" />
        ) : isError ? (
          <MembershipsState status="error" errorTitle="No pudimos cargar la plantilla" message={error.message} onRetry={() => refetch()} />
        ) : !template ? (
          <MembershipsState status="empty" emptyTitle="La plantilla ya no existe" emptyMessage="Pudo haber sido eliminada." />
        ) : (
          <>
            <SampleNotice />

            <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10 gap-5">
              <Text accessibilityRole="header" className="text-2xl font-extrabold text-neutral">
                {template.nombre}
              </Text>
              <Row icon="time-outline" label="Horario">
                {formatShiftTime(template.horaInicio)} – {formatShiftTime(template.horaFin)}
              </Row>
              <Row icon="hourglass-outline" label="Duración">
                {formatHours(template.horas)}
              </Row>
              <View className="gap-2">
                <Text className="text-xs text-neutral-muted">Días aplicables</Text>
                <WeekdayChips days={template.dias} />
              </View>
            </View>

            <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10 gap-4">
              <View className="flex-row items-center justify-between">
                <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
                  Equipo asignado
                </Text>
                <Text className="text-sm font-bold text-primary">{template.asignados} asignados</Text>
              </View>
              {template.asignados === 0 ? (
                <Text className="text-sm text-neutral-muted">Aún no hay personas asignadas a esta plantilla.</Text>
              ) : (
                <>
                  {template.equipo.map((member) => (
                    <View key={member.id} className="flex-row items-center gap-3 min-h-11">
                      <UserAvatar size={40} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
                      <Text numberOfLines={1} className="flex-1 text-base font-semibold text-neutral">
                        {member.nombre}
                      </Text>
                    </View>
                  ))}
                  {template.asignados > template.equipo.length ? (
                    <Text className="text-sm text-neutral-muted">
                      y {template.asignados - template.equipo.length} {template.asignados - template.equipo.length === 1 ? 'persona más' : 'personas más'}
                    </Text>
                  ) : null}
                </>
              )}
            </View>

            <View className="gap-3">
              <AppButton title="Editar parámetros" icon="create-outline" onPress={() => router.push(`/turnos/${template.id}/editar`)} />
              <AppButton title="Eliminar plantilla" variant="danger" icon="trash-outline" onPress={() => setDeleting(true)} />
            </View>
          </>
        )}
      </ScrollView>

      <DeleteShiftModal template={deleting ? (template ?? null) : null} onDeleted={() => router.back()} onClose={() => setDeleting(false)} />
    </SafeAreaView>
  );
}
