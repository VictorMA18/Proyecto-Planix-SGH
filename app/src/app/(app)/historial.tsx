import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { JourneyCard } from '@/components/attendance';
import { MembershipsState } from '@/components/organizations';
import { AppButton, ScreenHeader } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useAttendanceHistory } from '@/services/attendance';

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization } = useActiveOrganization();
  const history = useAttendanceHistory();
  const journeys = history.data?.pages.flatMap((page) => page.data) ?? [];
  const total = history.data?.pages[0]?.total ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Historial de asistencia" onBack={() => router.back()} />

      {history.isPending ? (
        <MembershipsState status="loading" loadingText="Cargando tu historial…" />
      ) : history.isError ? (
        <MembershipsState
          status="error"
          errorTitle="No pudimos cargar tu historial"
          message={history.error.message}
          onRetry={() => history.refetch()}
        />
      ) : (
        <FlatList
          data={journeys}
          keyExtractor={(journey) => journey.id}
          renderItem={({ item }) => <JourneyCard journey={item} />}
          contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={history.isRefetching && !history.isFetchingNextPage}
              onRefresh={() => history.refetch()}
              tintColor={ThemeColors.primary}
              colors={[ThemeColors.primary]}
            />
          }
          ListHeaderComponent={
            <Text className="text-sm text-neutral-muted">
              {total} {total === 1 ? 'jornada' : 'jornadas'} en {organization?.nombre ?? 'tu organización'}
            </Text>
          }
          ListEmptyComponent={
            <MembershipsState
              status="empty"
              emptyTitle="Aún no tienes jornadas"
              emptyMessage="Cuando registres tu primera entrada escaneando el QR, aparecerá aquí."
            />
          }
          ListFooterComponent={
            history.isFetchingNextPage ? (
              <ActivityIndicator color={ThemeColors.primary} />
            ) : history.hasNextPage ? (
              <View>
                <AppButton title="Cargar más" variant="secondary" onPress={() => history.fetchNextPage()} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
