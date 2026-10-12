import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { formatMonthTitle } from '@/utils/tasks';

import { MonthPickerSheet } from './MonthPickerSheet';

interface TasksMonthHeaderProps {
  month: string;
  onPrev: () => void;
  onNext: () => void;
  /** Saltar directamente a un mes (`YYYY-MM`) desde el selector de mes y año. */
  onPickMonth: (month: string) => void;
  /** Solo ADMIN y SUPERVISOR pueden crear tareas. */
  onCreate?: () => void;
}

const ArrowButton: React.FC<{ icon: 'chevron-back' | 'chevron-forward'; label: string; onPress: () => void }> = ({
  icon,
  label,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    className="w-11 h-11 rounded-full items-center justify-center active:bg-tertiary"
  >
    <Ionicons name={icon} size={20} color={ThemeColors.neutral} />
  </Pressable>
);

/** Mes visible con flechas para cambiarlo y, para quien puede, el botón «Nueva tarea». */
export const TasksMonthHeader: React.FC<TasksMonthHeaderProps> = ({ month, onPrev, onNext, onPickMonth, onCreate }) => {
  const title = formatMonthTitle(month);
  const [picking, setPicking] = useState(false);

  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-1 flex-row items-center">
        <ArrowButton icon="chevron-back" label="Mes anterior" onPress={onPrev} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. Elegir mes y año`}
          accessibilityLiveRegion="polite"
          onPress={() => setPicking(true)}
          className="flex-shrink min-h-11 flex-row items-center rounded-xl px-1 active:bg-tertiary"
        >
          <Text accessibilityRole="header" numberOfLines={1} className="flex-shrink text-xl font-extrabold text-neutral">
            {title}
          </Text>
          <Ionicons name="chevron-down" size={18} color={ThemeColors.primary} style={{ marginLeft: 4 }} />
        </Pressable>
        <ArrowButton icon="chevron-forward" label="Mes siguiente" onPress={onNext} />
      </View>

      {onCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nueva tarea"
          onPress={onCreate}
          style={{ borderCurve: 'continuous' }}
          className="min-h-11 flex-row items-center bg-primary rounded-2xl px-4 shadow-md shadow-primary/30 active:opacity-80"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text className="ml-1 text-sm font-bold text-white">Nueva tarea</Text>
        </Pressable>
      ) : null}

      <MonthPickerSheet visible={picking} value={month} onChange={onPickMonth} onClose={() => setPicking(false)} />
    </View>
  );
};
