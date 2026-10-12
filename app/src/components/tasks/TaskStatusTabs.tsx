import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TASK_STATUS_FILTERS } from '@/constants/tasks';
import type { TaskStatusFilter } from '@/schemas/task.schema';

interface TaskStatusTabsProps {
  value: TaskStatusFilter;
  counts: Record<TaskStatusFilter, number>;
  onChange: (status: TaskStatusFilter) => void;
}

/** Pestañas por estado (Todas, Pendientes, En progreso, Completadas, Vencidas) con sus conteos. */
export const TaskStatusTabs: React.FC<TaskStatusTabsProps> = ({ value, counts, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="-mx-5 flex-grow-0"
    contentContainerClassName="px-5 gap-2"
    accessibilityRole="tablist"
  >
    {TASK_STATUS_FILTERS.map((filter) => {
      const selected = filter.value === value;
      return (
        <Pressable
          key={filter.value}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={`${filter.label}, ${counts[filter.value]}`}
          onPress={() => onChange(filter.value)}
          style={{ borderCurve: 'continuous' }}
          className={`min-h-11 flex-row items-center rounded-full px-4 active:opacity-75 ${
            selected ? 'bg-primary' : 'bg-cardBg'
          }`}
        >
          <Text className={`text-sm ${selected ? 'font-bold text-white' : 'font-medium text-neutral'}`}>
            {filter.label}
          </Text>
          <View className={`ml-2 rounded-full px-2 py-0.5 ${selected ? 'bg-white/25' : 'bg-tertiary'}`}>
            <Text className={`text-[11px] font-bold ${selected ? 'text-white' : 'text-neutral-muted'}`}>
              {counts[filter.value]}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </ScrollView>
);
