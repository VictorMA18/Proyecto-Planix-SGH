import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { MembershipsState } from '@/components/organizations';
import {
  DayTasksHeader,
  MemberFilterSheet,
  MonthCalendar,
  PriorityFilterSheet,
  TaskCard,
  TaskFilterBar,
  TaskStatusTabs,
  TasksMonthHeader,
} from '@/components/tasks';
import { SampleBadge } from '@/components/ui';
import { TASK_PRIORITY_FILTERS } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useNow } from '@/hooks/use-now';
import { canCreateTasks, useMonthTasks, useSetTaskStatus, useTaskMembers } from '@/services/tasks';
import { useTasksStore } from '@/stores/useTasksStore';
import {
  countByStatus,
  dotsByDay,
  filterTasks,
  matchesStatus,
  sortTasks,
  taskDay,
  toDateKey,
} from '@/utils/tasks';

/**
 * Tareas: calendario del mes y tareas del día elegido de toda la organización, con filtros por
 * miembro, prioridad y estado. Lo único que cambia por rol es «Nueva tarea» (ADMIN y SUPERVISOR).
 */
export const TasksScreen: React.FC = () => {
  const router = useRouter();
  const { role } = useActiveOrganization();
  const canCreate = canCreateTasks(role);
  const now = useNow(60_000);
  const today = toDateKey(new Date(now));

  const store = useTasksStore();
  const members = useTaskMembers();
  const tasks = useMonthTasks(store.month);
  const setStatus = useSetTaskStatus();

  const [memberSheet, setMemberSheet] = useState(false);
  const [prioritySheet, setPrioritySheet] = useState(false);

  // Si el miembro filtrado ya no está en el equipo (o se cambió de organización), se ignora.
  const member = members.data?.find((m) => m.id === store.memberId) ?? null;
  const memberId = member?.id ?? null;

  const visible = useMemo(
    () => filterTasks(tasks.data ?? [], { memberId, priority: store.priority }),
    [tasks.data, memberId, store.priority],
  );
  const dots = useMemo(() => dotsByDay(visible), [visible]);
  const ofDay = useMemo(() => visible.filter((task) => taskDay(task) === store.selectedDate), [visible, store.selectedDate]);
  const counts = countByStatus(ofDay, now);
  const shown = sortTasks(
    ofDay.filter((task) => matchesStatus(task, store.status, now)),
    store.sort,
  );
  const priorityLabel =
    store.priority === 'TODAS'
      ? 'Prioridad'
      : (TASK_PRIORITY_FILTERS.find((p) => p.value === store.priority)?.label ?? 'Prioridad');

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tasks.isRefetching}
            onRefresh={() => {
              void members.refetch();
              void tasks.refetch();
            }}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <TasksMonthHeader
          month={store.month}
          onPrev={() => store.shiftMonth(-1)}
          onNext={() => store.shiftMonth(1)}
          onPickMonth={store.setMonth}
          onCreate={canCreate ? () => router.push({ pathname: '/tarea/nueva', params: { fecha: store.selectedDate } }) : undefined}
        />

        <TaskFilterBar
          memberLabel={member?.nombre ?? null}
          memberActive={!!memberId}
          priorityLabel={priorityLabel}
          priorityActive={store.priority !== 'TODAS'}
          onMemberPress={() => setMemberSheet(true)}
          onPriorityPress={() => setPrioritySheet(true)}
          onClear={store.resetFilters}
        />

        <MonthCalendar
          month={store.month}
          selectedDate={store.selectedDate}
          today={today}
          dots={dots}
          onSelect={store.selectDate}
          onToday={store.goToday}
        />

        <View className="gap-4">
          <DayTasksHeader
            date={store.selectedDate}
            count={ofDay.length}
            sort={store.sort}
            onToggleSort={store.toggleSort}
          />
          <View className="flex-row">
            <SampleBadge />
          </View>
          <TaskStatusTabs value={store.status} counts={counts} onChange={store.setStatus} />

          {tasks.isPending ? (
            <MembershipsState status="loading" loadingText="Cargando tareas…" />
          ) : tasks.isError ? (
            <MembershipsState
              status="error"
              errorTitle="No pudimos cargar las tareas"
              message={tasks.error.message}
              onRetry={() => tasks.refetch()}
            />
          ) : shown.length === 0 ? (
            <View className="items-center py-8 gap-2">
              <Text className="text-base font-bold text-neutral">
                {ofDay.length === 0 ? 'Sin tareas para este día' : 'Ninguna tarea con este estado'}
              </Text>
              <Text className="text-sm text-neutral-muted text-center">
                {ofDay.length === 0
                  ? canCreate
                    ? 'Elige otro día en el calendario o crea una tarea nueva.'
                    : 'Elige otro día en el calendario.'
                  : 'Prueba con otra pestaña de estado.'}
              </Text>
            </View>
          ) : (
            shown.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                now={now}
                busy={setStatus.isPending}
                onPress={() => router.push(`/tarea/${task.id}`)}
                // Cualquier miembro puede completar o reabrir una tarea (queda en su actividad).
                onToggleDone={() =>
                  setStatus.mutate({
                    taskId: task.id,
                    estado: task.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA',
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <MemberFilterSheet
        visible={memberSheet}
        members={members.data}
        isLoading={members.isPending}
        value={memberId}
        onChange={store.setMemberId}
        onClose={() => setMemberSheet(false)}
      />
      <PriorityFilterSheet
        visible={prioritySheet}
        value={store.priority}
        onChange={store.setPriority}
        onClose={() => setPrioritySheet(false)}
      />
    </View>
  );
};
