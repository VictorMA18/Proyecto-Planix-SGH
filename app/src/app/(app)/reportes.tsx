import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import { ChoiceChips, ScreenHeader, StatusChip, UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { reportRangeSchema, type ReportRange, type ReportRow } from '@/schemas/report.schema';
import { useAttendanceReport } from '@/services/reports';
import { formatDayLabel, formatMinutes } from '@/utils/attendance';
import { getInitials } from '@/utils/format';

const RANGE_LABEL: Record<ReportRange, string> = {
  ESTA_SEMANA: 'Esta semana',
  SEMANA_PASADA: 'Semana pasada',
  ESTE_MES: 'Este mes',
};

const Summary: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="flex-1">
    <Text className="text-xs text-neutral-muted">{label}</Text>
    <Text className="text-xl font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
      {value}
    </Text>
  </View>
);

const ReportRowItem: React.FC<{ row: ReportRow; onPress: () => void }> = ({ row, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${row.nombre}: ${formatMinutes(row.minutosTrabajados)} en ${row.diasTrabajados} días, ${row.tardanzas} tardanzas. Ver perfil`}
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className="w-full min-h-16 flex-row items-center bg-cardBg rounded-2xl p-4 shadow-sm shadow-primary/10 active:opacity-80"
  >
    <UserAvatar size={44} initials={getInitials(row.nombre)} uri={row.avatarUrl ?? undefined} />
    <View className="flex-1 mx-3">
      <Text numberOfLines={1} className="text-sm font-extrabold text-neutral">
        {row.nombre}
      </Text>
      <Text numberOfLines={1} className="text-xs text-neutral-muted">
        {ROLE_NAME[row.rol]} · {row.turno ?? 'Sin turno'}
        {row.estado !== 'ACTIVO' ? ' · Inactivo' : ''}
      </Text>
      <View className="flex-row flex-wrap gap-1.5 mt-2">
        <StatusChip text={`${row.diasTrabajados} días`} color={ThemeColors.primary} background={ThemeColors.tertiary} />
        {row.tardanzas > 0 ? (
          <StatusChip
            icon="time-outline"
            text={`${row.tardanzas} tarde · ${row.minutosTarde} min`}
            color={ThemeStatus.warningText}
            background={ThemeStatus.warningBg}
          />
        ) : row.puntuales > 0 ? (
          <StatusChip icon="checkmark-circle" text="Puntual" color={ThemeStatus.success} background={ThemeStatus.successBg} />
        ) : null}
      </View>
    </View>
    <Text className="text-base font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
      {formatMinutes(row.minutosTrabajados)}
    </Text>
  </Pressable>
);

export default function AttendanceReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canManageTeam, isPending: orgPending } = useActiveOrganization();
  const [range, setRange] = useState<ReportRange>('ESTA_SEMANA');
  const report = useAttendanceReport(range);

  const rows = report.data?.filas ?? [];
  const lateCount = rows.reduce((sum, row) => sum + row.tardanzas, 0);
  const worked = rows.filter((row) => row.diasTrabajados > 0).length;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Reporte de horas" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={report.isRefetching}
            onRefresh={() => report.refetch()}
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
            emptyMessage="El reporte de horas del equipo está disponible para los administradores de la organización."
          />
        ) : (
          <>
            <ChoiceChips
              label="Periodo"
              value={range}
              onChange={setRange}
              options={reportRangeSchema.options.map((option) => ({ value: option, label: RANGE_LABEL[option] }))}
            />

            {report.isPending ? (
              <MembershipsState status="loading" loadingText="Calculando el reporte…" />
            ) : report.isError ? (
              <MembershipsState
                status="error"
                errorTitle="No pudimos generar el reporte"
                message={report.error.message}
                onRetry={() => report.refetch()}
              />
            ) : (
              <>
                <View
                  style={{ borderCurve: 'continuous' }}
                  className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10 gap-4"
                >
                  <Text className="text-sm text-neutral-muted capitalize">
                    {formatDayLabel(report.data.desde)} – {formatDayLabel(report.data.hasta)}
                  </Text>
                  <View className="flex-row gap-3">
                    <Summary label="Horas del equipo" value={formatMinutes(report.data.totalMinutos)} />
                    <Summary label="Con asistencia" value={`${worked}/${rows.length}`} />
                    <Summary label="Tardanzas" value={String(lateCount)} />
                  </View>
                </View>

                {rows.length === 0 ? (
                  <MembershipsState
                    status="empty"
                    emptyTitle="Sin miembros"
                    emptyMessage="Aún no hay miembros activos en la organización."
                  />
                ) : (
                  rows.map((row) => (
                    <ReportRowItem
                      key={row.miembroId}
                      row={row}
                      onPress={() => router.push(`/miembro/${row.miembroId}`)}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
