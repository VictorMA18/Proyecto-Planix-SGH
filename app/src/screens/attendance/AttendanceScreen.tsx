import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AccumulatedTimeCard, ExitCard, MovementsTimeline, QrScannerCard, ShiftSettingsLink } from '@/components/attendance';
import { ComingSoonDialog, SampleNotice } from '@/components/home';
import { MembershipsState } from '@/components/organizations';
import { ConfirmModal } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useAttendanceToday, useRegisterMovement } from '@/services/attendance';

/** Asistencia: escaneo del QR, tiempo acumulado y movimientos de hoy. El administrador ve además el acceso a los turnos. */
export const AttendanceScreen: React.FC = () => {
  const router = useRouter();
  const { canManageTeam } = useActiveOrganization();
  const today = useAttendanceToday();
  const register = useRegisterMovement();
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const submit = (tipo: 'ENTRADA' | 'SALIDA', token?: string) =>
    register.mutate({ tipo, token }, {
      onError: (error) => setFailure({ title: 'No se pudo registrar', message: error.message }),
    });

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

        <SampleNotice />

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
              <ExitCard isBusy={register.isPending} onExit={() => setConfirmExit(true)} />
            ) : (
              <QrScannerCard isBusy={register.isPending} onScan={(token) => submit('ENTRADA', token)} />
            )}
            <AccumulatedTimeCard today={today.data} />
            <MovementsTimeline today={today.data} />
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmExit}
        icon="log-out-outline"
        title="¿Registrar tu salida?"
        message="Se guardará la hora actual como tu salida. Para volver a entrar deberás escanear el QR de nuevo."
        confirmLabel="Sí, registrar salida"
        isLoading={register.isPending}
        onConfirm={() => {
          setConfirmExit(false);
          submit('SALIDA');
        }}
        onCancel={() => setConfirmExit(false)}
      />
      <ComingSoonDialog feature={failure} onClose={() => setFailure(null)} />
    </View>
  );
};
