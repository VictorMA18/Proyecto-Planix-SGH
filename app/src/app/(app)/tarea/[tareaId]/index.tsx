import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import {
  ActivityPanel,
  AttachmentTile,
  CommentsPanel,
  DetailTabs,
  MarkdownText,
  SubtasksList,
  TaskActionsSheet,
  TaskInfoCard,
  TaskSection,
  TaskStatusStepper,
  type DetailTab,
} from '@/components/tasks';
import { AppButton, ConfirmModal, ScreenHeader } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useNow } from '@/hooks/use-now';
import {
  canCreateTasks,
  useDeleteTask,
  useDuplicateTask,
  useSetTaskStatus,
  useTask,
  useToggleSubtask,
} from '@/services/tasks';

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const { tareaId } = useLocalSearchParams<{ tareaId: string }>();
  const { role, membership } = useActiveOrganization();
  const manager = canCreateTasks(role);

  const task = useTask(tareaId);
  const setStatus = useSetTaskStatus();
  const toggleSubtask = useToggleSubtask();
  const duplicate = useDuplicateTask();
  const remove = useDeleteTask();

  const [tab, setTab] = useState<DetailTab>('DETALLES');
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [failure, setFailure] = useState('');

  const data = task.data;
  // Cualquier miembro (también EMPLEADO) mueve el estado y marca subtareas desde aquí, sin editar.
  const canWork = !!data;
  const onError = (err: Error) => setFailure(err.message);

  const duplicateTask = () => {
    setMenu(false);
    if (!data) return;
    duplicate.mutate(data.id, {
      onSuccess: (copy) => router.replace(`/tarea/${copy.id}`),
      onError,
    });
  };

  const deleteTask = () => {
    if (!data) return;
    remove.mutate(data.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        router.back();
      },
      onError,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader
        title={data?.titulo ?? 'Tarea'}
        onBack={() => router.back()}
        right={
          manager && data ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Más acciones de la tarea"
              onPress={() => setMenu(true)}
              className="w-11 h-11 rounded-full bg-cardBg border border-borderBg items-center justify-center active:opacity-70"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={ThemeColors.neutral} />
            </Pressable>
          ) : undefined
        }
      />

      {task.isPending ? (
        <MembershipsState status="loading" loadingText="Cargando la tarea…" />
      ) : task.isError || !data ? (
        <MembershipsState
          status="empty"
          emptyTitle="La tarea ya no existe"
          emptyMessage={task.error?.message ?? 'Pudo haber sido eliminada.'}
        />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-5"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={task.isRefetching}
                onRefresh={() => task.refetch()}
                tintColor={ThemeColors.primary}
                colors={[ThemeColors.primary]}
              />
            }
          >
            <View className="gap-4">
              <Text accessibilityRole="header" className="text-2xl font-extrabold text-neutral">
                {data.titulo}
              </Text>
              <TaskStatusStepper
                value={data.estado}
                disabled={setStatus.isPending}
                onChange={
                  canWork ? (estado) => setStatus.mutate({ taskId: data.id, estado }, { onError }) : undefined
                }
              />
            </View>

            <TaskInfoCard
              task={data}
              now={now}
              onEditAssignees={manager ? () => router.push(`/tarea/${data.id}/editar`) : undefined}
            />

            <DetailTabs value={tab} comments={data.comentarios} onChange={setTab} />

            {tab === 'DETALLES' ? (
              <>
                <TaskSection icon="document-text-outline" title="Descripción">
                  {data.descripcion ? (
                    <MarkdownText text={data.descripcion} />
                  ) : (
                    <Text className="text-sm text-neutral-muted">Sin descripción.</Text>
                  )}
                </TaskSection>

                <SubtasksList
                  subtasks={data.listaSubtareas}
                  busy={toggleSubtask.isPending}
                  onToggle={
                    canWork
                      ? (subtask) =>
                          toggleSubtask.mutate(
                            { taskId: data.id, subtaskId: subtask.id, completada: !subtask.completada },
                            { onError },
                          )
                      : undefined
                  }
                />

                <TaskSection icon="attach-outline" title={`Archivos adjuntos (${data.adjuntos.length})`}>
                  {data.adjuntos.length === 0 ? (
                    <Text className="text-sm text-neutral-muted">No hay archivos adjuntos.</Text>
                  ) : (
                    <View className="flex-row flex-wrap gap-3">
                      {data.adjuntos.map((attachment) => (
                        <AttachmentTile key={attachment.id} attachment={attachment} />
                      ))}
                    </View>
                  )}
                </TaskSection>
              </>
            ) : tab === 'COMENTARIOS' ? (
              <CommentsPanel taskId={data.id} myMemberId={membership?.id} />
            ) : (
              <ActivityPanel taskId={data.id} />
            )}
          </ScrollView>

          {manager ? (
            <View
              style={{ paddingBottom: Math.max(insets.bottom, 12) }}
              className="w-full bg-cardBg border-t border-borderBg px-5 pt-3"
            >
              <View className="w-full max-w-[480px] self-center flex-row items-center gap-2">
                <View className="flex-1">
                  <AppButton title="Crear otra tarea" icon="add-circle-outline" onPress={() => router.push('/tarea/nueva')} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar tarea"
                  onPress={() => router.push(`/tarea/${data.id}/editar`)}
                  style={{ borderCurve: 'continuous' }}
                  className="w-12 h-12 rounded-2xl bg-tertiary items-center justify-center active:opacity-80"
                >
                  <Ionicons name="create-outline" size={20} color={ThemeColors.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar tarea"
                  onPress={() => setConfirmDelete(true)}
                  style={{ backgroundColor: ThemeStatus.errorBg, borderCurve: 'continuous' }}
                  className="w-12 h-12 rounded-2xl items-center justify-center active:opacity-80"
                >
                  <Ionicons name="trash-outline" size={20} color={ThemeStatus.errorText} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <TaskActionsSheet
            visible={menu}
            title={data.titulo}
            onClose={() => setMenu(false)}
            onDuplicate={duplicateTask}
            onDelete={() => {
              setMenu(false);
              setConfirmDelete(true);
            }}
          />
          <ConfirmModal
            visible={confirmDelete}
            destructive
            icon="trash-outline"
            title={`¿Eliminar «${data.titulo}»?`}
            message="Se borrarán la tarea, sus subtareas, comentarios y actividad. No se puede deshacer."
            confirmLabel="Sí, eliminar tarea"
            isLoading={remove.isPending}
            onConfirm={deleteTask}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}

      <ConfirmModal
        visible={!!failure}
        icon="alert-circle-outline"
        title="No se pudo completar la acción"
        message={failure}
        confirmLabel="Entendido"
        hideCancel
        onConfirm={() => setFailure('')}
        onCancel={() => setFailure('')}
      />
    </SafeAreaView>
  );
}
