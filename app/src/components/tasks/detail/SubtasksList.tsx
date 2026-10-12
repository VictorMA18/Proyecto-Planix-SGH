import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import type { Subtask } from '@/schemas/task.schema';

import { TaskSection } from './TaskSection';

interface SubtasksListProps {
  subtasks: Subtask[];
  /** Sin `onToggle` las casillas son solo de lectura. */
  onToggle?: (subtask: Subtask) => void;
  busy?: boolean;
}

export function subtasksSummary(subtasks: { completada: boolean }[]) {
  const done = subtasks.filter((s) => s.completada).length;
  const percent = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;
  return { done, percent, label: `${done} de ${subtasks.length} completadas (${percent}%)` };
}

/** Subtareas con su avance; quien gestiona o está asignado puede marcarlas. */
export const SubtasksList: React.FC<SubtasksListProps> = ({ subtasks, onToggle, busy }) => {
  const summary = subtasksSummary(subtasks);

  return (
    <TaskSection icon="list-outline" title="Subtareas" trailing={subtasks.length ? summary.label : undefined}>
      {subtasks.length === 0 ? (
        <Text className="text-sm text-neutral-muted">Esta tarea no tiene subtareas.</Text>
      ) : (
        <>
          <ProgressBar value={summary.percent} color={ThemeColors.primary} />
          <View className="gap-1">
            {subtasks.map((subtask) => (
              <Pressable
                key={subtask.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subtask.completada, disabled: !onToggle || busy }}
                accessibilityLabel={subtask.titulo}
                disabled={!onToggle || busy}
                onPress={() => onToggle?.(subtask)}
                className="min-h-11 flex-row items-center active:opacity-70"
              >
                <Ionicons
                  name={subtask.completada ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={subtask.completada ? ThemeColors.primary : ThemeColors.mutedText}
                />
                <Text
                  className={`flex-1 ml-3 text-sm ${
                    subtask.completada ? 'text-neutral-muted line-through' : 'font-medium text-neutral'
                  }`}
                >
                  {subtask.titulo}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </TaskSection>
  );
};
