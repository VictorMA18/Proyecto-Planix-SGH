import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import { TaskForm } from '@/components/tasks';
import { ScreenHeader } from '@/components/ui';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import type { TaskFormInput } from '@/schemas/task.schema';
import { canCreateTasks, useSaveTask } from '@/services/tasks';
import { toDateKey } from '@/utils/tasks';

export default function NewTaskScreen() {
  const router = useRouter();
  const { fecha } = useLocalSearchParams<{ fecha?: string }>();
  const { role } = useActiveOrganization();
  const save = useSaveTask();
  const [error, setError] = useState('');

  // El día elegido en el calendario (si viene) y un horario de una hora por defecto.
  const [initial] = useState<TaskFormInput>(() => ({
    titulo: '',
    estado: 'PENDIENTE',
    prioridad: 'MEDIA',
    fecha: fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : toDateKey(new Date()),
    horaInicio: '09:00',
    horaFin: '10:00',
    ubicacion: '',
    miembroIds: [],
    etiquetas: [],
    descripcion: '',
    subtareas: [],
    adjuntos: [],
  }));

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Nueva tarea" variant="close" onBack={() => router.back()} />

      {!canCreateTasks(role) ? (
        <MembershipsState
          status="empty"
          emptyTitle="Solo para administradores y supervisores"
          emptyMessage="Pide a quien gestiona tu equipo que cree la tarea."
        />
      ) : (
        <TaskForm
          mode="create"
          initial={initial}
          isSaving={save.isPending}
          error={error}
          onCancel={() => router.back()}
          onSubmit={(form) => {
            setError('');
            save.mutate(
              { form },
              {
                onSuccess: (created) => router.replace(`/tarea/${created.id}`),
                onError: (err) => setError(err.message),
              },
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
