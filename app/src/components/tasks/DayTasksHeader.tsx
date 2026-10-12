import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TASK_SORT_LABEL } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import type { TaskSort } from '@/schemas/task.schema';
import { formatDayTitle } from '@/utils/tasks';

interface DayTasksHeaderProps {
  date: string;
  count: number;
  sort: TaskSort;
  onToggleSort: () => void;
}

/** Título del día elegido, número de tareas y orden (por hora o por prioridad). */
export const DayTasksHeader: React.FC<DayTasksHeaderProps> = ({ date, count, sort, onToggleSort }) => (
  <View className="flex-row items-center justify-between gap-3">
    <View className="flex-1 flex-row flex-wrap items-center gap-2">
      <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral">
        {formatDayTitle(date)}
      </Text>
      <View className="bg-tertiary rounded-full px-2.5 py-1">
        <Text className="text-[11px] font-bold text-primary">
          {count} {count === 1 ? 'tarea' : 'tareas'}
        </Text>
      </View>
    </View>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${sort === 'HORA' ? 'prioridad' : 'hora'}. Ahora por ${TASK_SORT_LABEL[sort].toLowerCase()}`}
      onPress={onToggleSort}
      className="min-h-11 flex-row items-center px-1 active:opacity-70"
    >
      <Ionicons name="swap-vertical" size={16} color={ThemeColors.primary} />
      <Text className="ml-1 text-sm font-bold text-primary">{TASK_SORT_LABEL[sort]}</Text>
    </Pressable>
  </View>
);
