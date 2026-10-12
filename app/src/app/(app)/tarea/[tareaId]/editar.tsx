import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import { SaveWarningModal, TaskForm } from '@/components/tasks';
import { ScreenHeader } from '@/components/ui';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useGoBack } from '@/hooks/use-go-back';
import type { TaskFormInput } from '@/schemas/task.schema';
import { canCreateTasks, useDeleteTask, useSaveTask, useTask, type SaveTaskResult } from '@/services/tasks';
import { taskFormDateParts } from '@/utils/tasks';

export default function EditTaskScreen() {
  const router = useRouter();
  const goBack = useGoBack('/tareas');
  const { tareaId } = useLocalSearchParams<{ tareaId: string }>();
  const { role } = useActiveOrganization();
  const task = useTask(tareaId);
  const save = useSaveTask();
  const remove = useDeleteTask();
  const [error, setError] = useState('');
  const [failed, setFailed] = useState<SaveTaskResult['failed'] | null>(null);

  // Valores iniciales fijos al abrir: si la tarea se recarga mientras se edita, no se pisa el formulario.
  const initial = useMemo<TaskFormInput | null>(
    () =>
      task.data
        ? {
            titulo: task.data.titulo,
            estado: task.data.estado,
            prioridad: task.data.prioridad,
            ...taskFormDateParts(task.data),
            ubicacion: task.data.ubicacion ?? '',
            miembroIds: task.data.asignados.map((a) => a.miembroId),
            etiquetas: task.data.etiquetas,
            descripcion: task.data.descripcion ?? '',
            subtareas: task.data.listaSubtareas,
            adjuntos: task.data.adjuntos,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.data?.id],
  );

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Editar tarea" variant="close" onBack={() => goBack()} />

      {!canCreateTasks(role) ? (
        <MembershipsState
          status="empty"
          emptyTitle="Solo para administradores y supervisores"
          emptyMessage="Pide a quien gestiona tu equipo que haga el cambio."
        />
      ) : task.isPending ? (
        <MembershipsState status="loading" loadingText="Cargando la tarea…" />
      ) : !initial ? (
        <MembershipsState status="empty" emptyTitle="La tarea ya no existe" emptyMessage="Pudo haber sido eliminada." />
      ) : (
        <TaskForm
          mode="edit"
          initial={initial}
          isSaving={save.isPending}
          isDeleting={remove.isPending}
          error={error}
          onCancel={() => goBack()}
          onSubmit={(form) => {
            setError('');
            save.mutate(
              { id: tareaId, form, previousAttachments: task.data?.adjuntos ?? [] },
              {
                // Si algún adjunto falló, se avisa antes de volver al detalle.
                onSuccess: (result) => (result.failed.length ? setFailed(result.failed) : goBack()),
                onError: (err) => setError(err.message),
              },
            );
          }}
          onDelete={() =>
            remove.mutate(tareaId!, {
              // Se vuelve al calendario: el detalle de la tarea ya no existe.
              onSuccess: () => router.dismissTo('/tareas'),
              onError: (err) => setError(err.message),
            })
          }
        />
      )}

      <SaveWarningModal
        failed={failed}
        onClose={() => {
          setFailed(null);
          goBack();
        }}
      />
    </SafeAreaView>
  );
}
