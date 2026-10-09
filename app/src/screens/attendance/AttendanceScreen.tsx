import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  AccumulatedTimeCard,
  ExitCard,
  MovementsTimeline,
  QrScannerCard,
  ShiftSettingsLink,
} from '@/components/attendance';
import { MembershipsState } from '@/components/organizations';
import { ConfirmModal } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useAttendanceToday, useRegisterEntry, useRegisterExit } from '@/services/attendance';

/** Asistencia: escaneo del QR, tiempo acumulado y movimientos de hoy. El ADMIN ve además el acceso a los turnos. */
export const AttendanceScreen: React.FC = () => {
  const router = useRouter();
  const { canManageTeam } = useActiveOrganization();
  const today = useAttendanceToday();
  const entry = useRegisterEntry();
  const exit = useRegisterExit();
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const busy = entry.isPending || exit.isPending;

  const onError = (title: string) => (error: Error) => setFailure({ title, message: error.message });

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: 24 }}
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
        {canManageTeam ? <ShiftSettingsLink onPress={() => router.push('/turnos')} /> : null}

        {today.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando tu jornada…" />
        ) : today.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar tu asistencia"
            message={today.error.message}
            onRetry={() => today.refetch()}
          />
        ) : (
          <>
            {today.data.jornada?.estadoActual === 'DENTRO' ? (
              <ExitCard isBusy={exit.isPending} onExit={() => setConfirmExit(true)} />
            ) : (
              <QrScannerCard
                isBusy={busy}
                onScan={(token) => entry.mutate(token, { onError: onError('No se pudo registrar la entrada') })}
              />
            )}
            <AccumulatedTimeCard today={today.data} />
            <MovementsTimeline today={today.data} onSeeHistory={() => router.push('/historial')} />
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmExit}
        icon="log-out-outline"
        title="¿Registrar tu salida?"
        message="Se guardará la hora actual como tu salida. Para volver a entrar deberás escanear el QR de nuevo."
        confirmLabel="Sí, registrar salida"
        isLoading={exit.isPending}
        onConfirm={() => {
          setConfirmExit(false);
          exit.mutate(undefined, { onError: onError('No se pudo registrar la salida') });
        }}
        onCancel={() => setConfirmExit(false)}
      />
      <ConfirmModal
        visible={!!failure}
        icon="alert-circle-outline"
        title={failure?.title ?? ''}
        message={failure?.message}
        confirmLabel="Entendido"
        hideCancel
        onConfirm={() => setFailure(null)}
        onCancel={() => setFailure(null)}
      />
    </View>
  );
};
