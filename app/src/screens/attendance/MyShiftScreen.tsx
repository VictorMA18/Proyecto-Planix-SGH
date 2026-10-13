import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import { WeekdayChips } from '@/components/shifts/WeekdayChips';
import { ScreenHeader, StatusChip, UserAvatar } from '@/components/ui';
import { SHIFT_STATUS } from '@/constants/attendance';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useGoBack } from '@/hooks/use-go-back';
import { useNow } from '@/hooks/use-now';
import type { AttendanceToday } from '@/schemas/attendance.schema';
import { useAttendanceToday } from '@/services/attendance';
import { formatHours, formatMinutes, formatShiftTime, shiftStatus } from '@/utils/attendance';
import { formatClock12, getInitials } from '@/utils/format';

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

const Card: React.FC<{ title?: string; trailing?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  trailing,
  children,
}) => (
  <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10 gap-5">
    {title ? (
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" className="flex-1 text-lg font-extrabold text-neutral">
          {title}
        </Text>
        {trailing}
      </View>
    ) : null}
    {children}
  </View>
);

/** Cómo va el turno hoy: horario de hoy, estado y la entrada registrada con su puntualidad. */
const TodayCard: React.FC<{ data: AttendanceToday; now: number }> = ({ data, now }) => {
  const status = SHIFT_STATUS[shiftStatus(data.turno, now)];
  const jornada = data.jornada;

  return (
    <Card
      title="Hoy"
      trailing={<StatusChip icon={status.icon} text={status.label} color={status.color} background={status.background} />}
    >
      {!data.turno ? (
        <Text className="text-sm text-neutral-muted">Hoy no te toca este turno. ¡Disfruta tu día!</Text>
      ) : (
        <>
          <Row icon="calendar-outline" label="Horario de hoy">
            {formatClock12(data.turno.inicio)} – {formatClock12(data.turno.fin)}
          </Row>
          <Row icon="log-in-outline" label="Tu entrada">
            {jornada ? formatClock12(jornada.horaInicio) : 'Aún no registrada'}
          </Row>
          {jornada && jornada.puntual !== null ? (
            <View
              style={{
                borderCurve: 'continuous',
                backgroundColor: jornada.puntual ? ThemeStatus.successBg : ThemeStatus.warningBg,
              }}
              className="flex-row items-center rounded-2xl p-3"
            >
              <Ionicons
                name={jornada.puntual ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={jornada.puntual ? ThemeStatus.success : ThemeStatus.warningText}
              />
              <Text
                style={{ color: jornada.puntual ? ThemeStatus.success : ThemeStatus.warningText }}
                className="ml-2 flex-1 text-sm font-bold"
              >
                {jornada.puntual
                  ? 'Llegaste puntual'
                  : `Llegaste ${formatMinutes(jornada.minutosTarde ?? 0)} tarde`}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
};

/**
 * Detalle de «Mi turno» para cualquier rol (solo lectura): la plantilla asignada, cómo va hoy y el
 * equipo del turno. Sale de `GET /asistencia/hoy`; la configuración de turnos sigue siendo del ADMIN.
 */
export const MyShiftScreen: React.FC = () => {
  const goBack = useGoBack('/asistencia');
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const { membership } = useActiveOrganization();
  const today = useAttendanceToday();
  const template = today.data?.plantilla ?? null;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Mi turno" onBack={() => goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={today.isRefetching}
            onRefresh={() => today.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        {today.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando tu turno…" />
        ) : today.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar tu turno"
            message={today.error.message}
            onRetry={() => today.refetch()}
          />
        ) : !template ? (
          <MembershipsState
            status="empty"
            emptyIcon="calendar-clear-outline"
            emptyTitle="Sin turno asignado"
            emptyMessage="Un administrador debe asignarte un turno para medir tu puntualidad."
          />
        ) : (
          <>
            <Card>
              <Text accessibilityRole="header" className="text-2xl font-extrabold text-neutral">
                {template.nombre}
              </Text>
              <Row icon="time-outline" label="Horario">
                {formatShiftTime(template.horaInicio)} – {formatShiftTime(template.horaFin)}
              </Row>
              <Row icon="hourglass-outline" label="Duración">
                {formatHours(template.horas)}
              </Row>
              <Row icon="shield-checkmark-outline" label="Tolerancia de entrada">
                {today.data.toleranciaMin} min
              </Row>
              <View className="gap-2">
                <Text className="text-xs text-neutral-muted">Días aplicables</Text>
                <WeekdayChips days={template.dias} />
              </View>
            </Card>

            <TodayCard data={today.data} now={now} />

            <Card
              title="Equipo del turno"
              trailing={<Text className="text-sm font-bold text-primary">{template.asignados} asignados</Text>}
            >
              {template.equipo.map((member) => {
                const isMe = member.id === membership?.id;
                return (
                  <View key={member.id} className="flex-row items-center gap-3 min-h-11">
                    <UserAvatar size={40} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
                    <Text numberOfLines={1} className="flex-1 text-base font-semibold text-neutral">
                      {member.nombre}
                    </Text>
                    {isMe ? (
                      <StatusChip text="TÚ" color={ThemeColors.primary} background={ThemeColors.tertiary} />
                    ) : null}
                  </View>
                );
              })}
              {template.asignados > template.equipo.length ? (
                <Text className="text-sm text-neutral-muted">
                  y {template.asignados - template.equipo.length}{' '}
                  {template.asignados - template.equipo.length === 1 ? 'persona más' : 'personas más'}
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
