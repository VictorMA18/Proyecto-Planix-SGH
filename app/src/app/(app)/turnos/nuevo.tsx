import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { ShiftForm } from '@/components/shifts';
import { FormScreenLayout } from '@/components/ui';
import { useSaveShift } from '@/services/attendance';

export default function NewShiftScreen() {
  const router = useRouter();
  const save = useSaveShift();
  const [error, setError] = useState('');

  return (
    <FormScreenLayout title="Nueva plantilla">
      <Text className="text-sm text-neutral-muted mb-5">
        Define el horario y los días en que aplica. Elige también a las personas que tendrán este turno.
      </Text>
      <ShiftForm
        submitLabel="Crear plantilla"
        isSaving={save.isPending}
        error={error}
        onCancel={() => router.back()}
        onSubmit={(form) => {
          setError('');
          save.mutate(
            { form },
            {
              onSuccess: () => router.back(),
              onError: (err) => setError(err.message),
            },
          );
        }}
      />
    </FormScreenLayout>
  );
}
