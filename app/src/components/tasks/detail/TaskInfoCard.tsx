import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { StatusChip, UserAvatar } from '@/components/ui';
import { TASK_PRIORITY } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import type { TaskDetail } from '@/schemas/task.schema';
import { getInitials } from '@/utils/format';
import { formatDue, formatShortDate, formatTimeRange, isOverdue } from '@/utils/tasks';

import { TagChip } from '../TagChip';

const Label: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({ icon, text }) => (
  <View className="flex-row items-center">
    <Ionicons name={icon} size={15} color={ThemeColors.mutedText} />
    <Text className="ml-1.5 text-xs text-neutral-muted">{text}</Text>
  </View>
);

interface TaskInfoCardProps {
  task: TaskDetail;
  now: number;
  /** ADMIN y SUPERVISOR: el «+» de asignados abre la edición. */
  onEditAssignees?: () => void;
}

/** Asignados, prioridad, vencimiento, horario, ubicación y etiquetas. */
export const TaskInfoCard: React.FC<TaskInfoCardProps> = ({ task, now, onEditAssignees }) => {
  const priority = TASK_PRIORITY[task.prioridad];
  const overdue = isOverdue(task, now);
  const due = task.fechaFin ?? task.fechaInicio;

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10 gap-4">
      <View className="gap-2">
        <Label icon="people-outline" text="Asignados" />
        <View className="flex-row flex-wrap items-center gap-2">
          {task.asignados.length === 0 ? (
            <Text className="text-sm text-neutral-muted">Sin personas asignadas</Text>
          ) : (
            task.asignados.map((person) => (
              <View key={person.miembroId} className="flex-row items-center bg-inputBg rounded-full pl-1 pr-3 py-1">
                <UserAvatar size={28} initials={getInitials(person.nombre)} uri={person.avatarUrl ?? undefined} />
                <Text className="ml-2 text-sm font-semibold text-neutral">{person.nombre}</Text>
              </View>
            ))
          )}
          {onEditAssignees ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar personas asignadas"
              onPress={onEditAssignees}
              className="w-11 h-11 rounded-full border border-dashed border-primary/50 items-center justify-center active:opacity-70"
            >
              <Ionicons name="add" size={20} color={ThemeColors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="flex-row gap-4 pt-4 border-t border-borderBg">
        <View className="flex-1 gap-2">
          <Label icon="flag-outline" text="Prioridad" />
          <View className="flex-row">
            <StatusChip
              icon={task.prioridad === 'ALTA' ? 'flame' : undefined}
              text={priority.short}
              color={priority.color}
              background={priority.background}
            />
          </View>
        </View>
        <View className="flex-1 gap-1">
          <Label icon="calendar-outline" text="Vencimiento" />
          <Text className="text-sm font-bold text-neutral">{formatShortDate(due)}</Text>
          <Text className={`text-xs font-semibold ${overdue ? 'text-red-600' : 'text-neutral-muted'}`}>
            {formatDue(task, now)}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 pt-4 border-t border-borderBg">
        <View className="flex-1 gap-1">
          <Label icon="time-outline" text="Horario" />
          <Text className="text-sm font-bold text-neutral">{formatTimeRange(task)}</Text>
        </View>
        <View className="flex-1 gap-1">
          <Label icon="location-outline" text="Ubicación" />
          <Text className="text-sm font-bold text-neutral">{task.ubicacion ?? 'Sin ubicación'}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 pt-4 border-t border-borderBg">
        <Label icon="pricetag-outline" text="Etiquetas" />
        <View className="flex-row flex-wrap gap-1.5">
          {task.etiquetas.length === 0 ? (
            <Text className="text-xs text-neutral-muted">Sin etiquetas</Text>
          ) : (
            task.etiquetas.map((tag) => <TagChip key={tag} tag={tag} />)
          )}
        </View>
      </View>

    </View>
  );
};
