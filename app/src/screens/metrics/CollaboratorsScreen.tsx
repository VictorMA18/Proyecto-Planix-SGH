import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollaboratorRow } from '@/components/metrics';
import { MembershipsState } from '@/components/organizations';
import { TeamPagination, TeamSearchBar } from '@/components/team';
import { ScreenHeader } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useGoBack } from '@/hooks/use-go-back';
import { useCollaborators } from '@/services/metrics';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { formatPeriod, periodEnd, periodStart } from '@/utils/metrics';

/** «Ver todos»: cada colaborador del periodo elegido en Métricas, con búsqueda y paginación. */
export function CollaboratorsScreen() {
  const router = useRouter();
  const goBack = useGoBack('/metricas');
  const insets = useSafeAreaInsets();
  const { canManageTeam, isPending: orgPending } = useActiveOrganization();
  const { periodType, anchorDate, search, page, setSearch, setPage } = useMetricsStore();
  const debouncedSearch = useDebouncedValue(search, 300);
  const list = useCollaborators(periodType, anchorDate, debouncedSearch, page);

  const periodLabel = formatPeriod(periodType, periodStart(periodType, anchorDate), periodEnd(periodType, anchorDate));

  const data = list.data;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Colaboradores" onBack={() => goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isPlaceholderData}
            onRefresh={() => list.refetch()}
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
            emptyMessage="El detalle de cada colaborador está disponible para los administradores."
          />
        ) : (
          <>
            <View>
              <Text className="text-sm text-neutral-muted">Periodo</Text>
              <Text className="text-lg font-extrabold text-neutral">{periodLabel}</Text>
            </View>
            <TeamSearchBar value={search} onChangeText={setSearch} />

            {list.isPending ? (
              <MembershipsState status="loading" loadingText="Calculando el detalle…" />
            ) : list.isError ? (
              <MembershipsState
                status="error"
                errorTitle="No pudimos cargar a los colaboradores"
                message={list.error.message}
                onRetry={() => list.refetch()}
              />
            ) : list.data.items.length === 0 ? (
              <MembershipsState
                status="empty"
                emptyIcon="people-outline"
                emptyTitle="Sin resultados"
                emptyMessage="Ningún colaborador coincide con tu búsqueda."
              />
            ) : (
              <View className={`gap-3 ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
                {list.data.items.map((c) => (
                  <CollaboratorRow key={c.miembroId} collaborator={c} onPress={() => router.push(`/miembro/${c.miembroId}`)} />
                ))}
              </View>
            )}

            {data && data.total > 0 ? (
              <TeamPagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
