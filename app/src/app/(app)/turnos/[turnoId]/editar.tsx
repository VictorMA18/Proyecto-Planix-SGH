import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { MembershipsState } from '@/components/organizations';
import { ShiftForm } from '@/components/shifts';
import { FormScreenLayout } from '@/components/ui';
import { useSaveShift, useShiftTemplate } from '@/services/attendance';

export default function EditShiftScreen() {
  const router = useRouter();
  const { turnoId } = useLocalSearchParams<{ turnoId: string }>();
  const { template, isPending, isError, error: loadError, refetch } = useShiftTemplate(turnoId);
  const save = useSaveShift();
  const [error, setError] = useState('');

  return (
    <FormScreenLayout title="Editar parámetros">
      {isPending ? (
        <MembershipsState status="loading" loadingText="Cargando la plantilla…" />
      ) : isError ? (
        <MembershipsState status="error" errorTitle="No pudimos cargar la plantilla" message={loadError.message} onRetry={() => refetch()} />
      ) : !template ? (
        <MembershipsState status="empty" emptyTitle="La plantilla ya no existe" emptyMessage="Pudo haber sido eliminada." />
      ) : (
        <>
          <Text className="text-sm text-neutral-muted mb-5">
            Cambia el horario o los días de «{template.nombre}». Aquí también puedes elegir quién tiene este turno.
          </Text>
          <ShiftForm
            initial={{ nombre: template.nombre, horaInicio: template.horaInicio, horaFin: template.horaFin, dias: template.dias, miembroIds: template.miembroIds }}
            submitLabel="Guardar cambios"
            isSaving={save.isPending}
            error={error}
            onCancel={() => router.back()}
            onSubmit={(form) => {
              setError('');
              save.mutate(
                { id: template.id, form },
                { onSuccess: () => router.back(), onError: (err) => setError(err.message) },
              );
            }}
          />
        </>
      )}
    </FormScreenLayout>
  );
}
