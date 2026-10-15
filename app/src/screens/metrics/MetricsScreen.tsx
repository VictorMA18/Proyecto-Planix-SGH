import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CollaboratorsSection,
  DailyLogSection,
  ExportReportCard,
  HoursProgressCard,
  MetricsFilterChips,
  PerformanceTrendCard,
  PeriodSheet,
  StatTiles,
} from '@/components/metrics';
import { MembershipsState } from '@/components/organizations';
import { MemberPickerSheet } from '@/components/team';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useReportExport } from '@/hooks/use-report-export';
import { useMetrics } from '@/services/metrics';
import { useTaskMembers } from '@/services/tasks';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { formatPeriod, isCurrentPeriod, shiftPeriod } from '@/utils/metrics';
import { toDateKey } from '@/utils/tasks';

/**
 * Pestaña «Métricas» (Reportes y Horas). El ADMIN ve el total del equipo y puede elegir a cualquier
 * miembro (él primero); los demás roles ven solo sus métricas. Todo se calcula en el backend.
 */
export function MetricsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization, membership, canManageTeam, isPending: orgPending } = useActiveOrganization();
  const store = useMetricsStore();
  const { periodType, anchorDate, reset } = store;
  const [periodOpen, setPeriodOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  // Al cambiar de organización: periodo actual y todo el equipo. Con llaves: el `set` de un store
  // con `persist` devuelve una promesa, y un efecto solo puede devolver su función de limpieza.
  useEffect(() => {
    reset();
  }, [organization?.id, reset]);

  // Quien no es ADMIN siempre mira lo suyo.
  const memberId = canManageTeam ? store.memberId : (membership?.id ?? null);
  const metrics = useMetrics(periodType, anchorDate, memberId);
  const members = useTaskMembers();
  const exporter = useReportExport();

  const data = metrics.data;
  const isTeam = data?.alcance === 'EQUIPO';
  const periodLabel = data ? formatPeriod(periodType, data.periodo.desde, data.periodo.hasta) : 'Periodo';
  const canGoNext = !isCurrentPeriod(periodType, anchorDate);
  const selected = members.data?.find((m) => m.id === store.memberId) ?? null;
  const isSelf = !!membership && store.memberId === membership.id;

  const scopeLabel = !store.memberId
    ? `Todo el equipo${data?.alcance === 'EQUIPO' ? ` (${data.miembrosActivos})` : ''}`
    : isSelf
      ? 'Tú'
      : (selected?.nombre ?? data?.miembro?.nombre ?? 'Miembro');

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
        contentContainerStyle={{ paddingBottom: 24 + Math.max(insets.bottom, 0) / 2 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={metrics.isRefetching && !metrics.isPlaceholderData}
            onRefresh={() => metrics.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <View className="gap-3">
          <View>
            <Text accessibilityRole="header" className="text-3xl font-extrabold text-neutral">
              Reportes y Horas
            </Text>
            <Text className="text-sm text-neutral-muted mt-1">
              {canManageTeam
                ? 'Rendimiento, puntualidad y horas del equipo o de cada colaborador.'
                : 'Tu rendimiento, puntualidad y horas trabajadas.'}
            </Text>
          </View>
          <MetricsFilterChips
            periodLabel={periodLabel}
            onOpenPeriod={() => setPeriodOpen(true)}
            scope={
              canManageTeam
                ? {
                    label: scopeLabel,
                    avatar: store.memberId
                      ? {
                          name: selected?.nombre ?? data?.miembro?.nombre ?? '?',
                          uri: selected?.avatarUrl ?? data?.miembro?.avatarUrl ?? null,
                        }
                      : null,
                    onPress: () => setMemberOpen(true),
                  }
                : undefined
            }
          />
        </View>

        {orgPending || metrics.isPending ? (
          <MembershipsState status="loading" loadingText="Calculando tus métricas…" />
        ) : metrics.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos calcular las métricas"
            message={metrics.error.message}
            onRetry={() => metrics.refetch()}
          />
        ) : data ? (
          <View className={`gap-4 ${metrics.isPlaceholderData ? 'opacity-60' : ''}`}>
            <PerformanceTrendCard
              trend={data.tendencia}
              isTeam={isTeam}
              animationKey={`${data.periodo.desde}-${data.miembro?.miembroId ?? 'equipo'}`}
            />
            <HoursProgressCard hours={data.horas} isTeam={isTeam} />
            <StatTiles punctuality={data.puntualidad} overtime={data.horasExtra} />

            {data.colaboradores ? (
              <CollaboratorsSection
                collaborators={data.colaboradores}
                onSeeAll={() => router.push('/metricas/colaboradores')}
                onOpenMember={(id) => router.push(`/miembro/${id}`)}
              />
            ) : null}
            {data.registroDiario ? <DailyLogSection log={data.registroDiario} tasks={data.tareas} /> : null}

            <ExportReportCard
              isTeam={isTeam}
              busy={exporter.busy}
              error={exporter.error}
              onExport={(format) => exporter.exportReport(format, periodType, anchorDate, memberId)}
            />
          </View>
        ) : null}
      </ScrollView>

      <PeriodSheet
        visible={periodOpen}
        onClose={() => setPeriodOpen(false)}
        type={periodType}
        label={periodLabel}
        canGoNext={canGoNext}
        onTypeChange={store.setPeriodType}
        onShift={(delta) => store.setAnchorDate(shiftPeriod(periodType, anchorDate, delta))}
        onToday={() => store.setAnchorDate(toDateKey(new Date()))}
      />
      {canManageTeam ? (
        <MemberPickerSheet
          visible={memberOpen}
          title="Ver métricas de"
          allLabel="Todo el equipo"
          allDescription="Totales de la organización"
          members={members.data}
          isLoading={members.isPending}
          value={store.memberId}
          onChange={store.setMemberId}
          onClose={() => setMemberOpen(false)}
          currentMemberId={membership?.id}
        />
      ) : null}
    </View>
  );
}
