import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { StatusChip, UserAvatar } from '@/components/ui';
import { TASK_PRIORITY, TASK_STATUS } from '@/constants/tasks';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { CalendarTask } from '@/schemas/task.schema';
import { getInitials } from '@/utils/format';
import { formatTimeRange, isOngoing, isOverdue, taskProgress } from '@/utils/tasks';

import { TagChip } from './TagChip';

interface TaskCardProps {
  task: CalendarTask;
  now: number;
  busy: boolean;
  onPress: () => void;
  /** Marcar o desmarcar la tarea como completada; sin ella no se muestra la casilla. */
  onToggleDone?: () => void;
}

/** Tarea del día: prioridad, estado, horario, lugar y personas asignadas. */
export const TaskCard: React.FC<TaskCardProps> = ({ task, now, busy, onPress, onToggleDone }) => {
  const done = task.estado === 'COMPLETADA';
  const urgent = task.prioridad === 'ALTA';
  const ongoing = isOngoing(task, now);
  const overdue = isOverdue(task, now);
  const preview = task.asignados.slice(0, 3);
  const extra = task.asignados.length - preview.length;
  const priority = TASK_PRIORITY[task.prioridad];
  const people =
    task.asignados.length === 1
      ? task.asignados[0].nombre
      : `${task.asignados.length} asignados`;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className={`w-full bg-cardBg rounded-3xl shadow-sm shadow-primary/10 overflow-hidden ${done ? 'opacity-70' : ''}`}
    >
      {task.estado === 'EN_PROGRESO' ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: taskProgress(task, now) }}
          className="h-1 w-full bg-tertiary"
        >
          <View
            style={{ width: `${taskProgress(task, now)}%`, backgroundColor: ThemeColors.primary }}
            className="h-full"
          />
        </View>
      ) : null}

      <View className="flex-row">
        {urgent ? <View style={{ backgroundColor: ThemeColors.error }} className="w-1" /> : null}

        {onToggleDone ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done, disabled: busy }}
            accessibilityLabel={`Marcar «${task.titulo}» como ${done ? 'pendiente' : 'completada'}`}
            disabled={busy}
            onPress={onToggleDone}
            className="w-12 items-center pt-4 active:opacity-60"
          >
            <Ionicons
              name={done ? 'checkbox' : 'square-outline'}
              size={24}
              color={done ? ThemeStatus.success : ThemeColors.mutedText}
            />
          </Pressable>
        ) : (
          <View className={urgent ? 'w-3' : 'w-4'} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${task.titulo}. ${priority.label}. ${TASK_STATUS[task.estado].label}${
            task.etiquetas.length ? `. Etiquetas: ${task.etiquetas.join(', ')}` : ''
          }${
            overdue ? ', vencida' : ''
          }. ${formatTimeRange(task)}${task.ubicacion ? `, ${task.ubicacion}` : ''}. ${people}. Ver detalle`}
          onPress={onPress}
          className="flex-1 py-4 pr-4 gap-2 active:opacity-80"
        >
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className={`flex-1 text-base font-extrabold ${done ? 'text-neutral-muted line-through' : 'text-neutral'}`}
            >
              {task.titulo}
            </Text>
            {task.estado === 'EN_PROGRESO' || task.estado === 'REVISION' ? (
              <StatusChip
                icon="ellipse"
                text={TASK_STATUS[task.estado].label}
                color={TASK_STATUS[task.estado].color}
                background={TASK_STATUS[task.estado].background}
              />
            ) : (
              <StatusChip
                icon={urgent ? 'flag' : undefined}
                text={priority.label}
                color={priority.color}
                background={priority.background}
              />
            )}
          </View>

          {task.etiquetas.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {task.etiquetas.map((tag) => (
                <TagChip key={tag} tag={tag} small />
              ))}
            </View>
          ) : null}

          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Ionicons name="time-outline" size={15} color={ongoing ? ThemeColors.primary : ThemeColors.mutedText} />
            <Text className={`text-sm ${ongoing ? 'font-bold text-primary' : 'text-neutral-muted'}`}>
              {formatTimeRange(task)}
              {ongoing ? ' (en curso)' : ''}
            </Text>
            {task.ubicacion ? (
              <>
                <Text className="text-sm text-neutral-muted">·</Text>
                <Ionicons name="location-outline" size={15} color={ThemeColors.mutedText} />
                <Text className="text-sm text-neutral-muted">{task.ubicacion}</Text>
              </>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center">
              <View className="flex-row mr-2">
                {preview.map((person, i) => (
                  <View key={person.miembroId} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                    <UserAvatar size={28} initials={getInitials(person.nombre)} uri={person.avatarUrl ?? undefined} />
                  </View>
                ))}
                {extra > 0 ? (
                  <View
                    style={{ marginLeft: -8 }}
                    className="w-7 h-7 rounded-full bg-tertiary border-2 border-white items-center justify-center"
                  >
                    <Text className="text-[10px] font-bold text-primary">+{extra}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} className="text-xs font-bold text-neutral">
                {people}
              </Text>
            </View>
            {overdue ? (
              <StatusChip
                icon="alert-circle"
                text="Vencida"
                color={ThemeStatus.errorText}
                background={ThemeStatus.errorBg}
              />
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
};
