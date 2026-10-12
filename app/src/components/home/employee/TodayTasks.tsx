import React from 'react';
import { Text, View } from 'react-native';

import { TaskCard } from '@/components/tasks/TaskCard';
import type { CalendarTask } from '@/schemas/task.schema';

import { SectionHeader } from '../shared';

interface TodayTasksProps {
  tasks: CalendarTask[];
  now: number;
  busy: boolean;
  onOpen: (task: CalendarTask) => void;
  onToggleDone: (task: CalendarTask) => void;
  onSeeAll: () => void;
}

/** Mis tareas de hoy: las mismas tarjetas de la pestaña Tareas (primero las pendientes). */
export const TodayTasks: React.FC<TodayTasksProps> = ({ tasks, now, busy, onOpen, onToggleDone, onSeeAll }) => {
  const pending = tasks.filter((task) => task.estado !== 'COMPLETADA').length;
  const ordered = [...tasks].sort(
    (a, b) => Number(a.estado === 'COMPLETADA') - Number(b.estado === 'COMPLETADA') || a.fechaInicio.localeCompare(b.fechaInicio),
  );

  return (
    <View className="gap-4">
      <SectionHeader
        title="Mis tareas de hoy"
        badge={pending === 0 ? 'Todo al día' : `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`}
        action={{ label: 'Ver todas', onPress: onSeeAll }}
      />
      {ordered.length === 0 ? (
        <Text className="text-sm text-neutral-muted">No tienes tareas asignadas para hoy.</Text>
      ) : (
        ordered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            now={now}
            busy={busy}
            onPress={() => onOpen(task)}
            onToggleDone={() => onToggleDone(task)}
          />
        ))
      )}
    </View>
  );
};
