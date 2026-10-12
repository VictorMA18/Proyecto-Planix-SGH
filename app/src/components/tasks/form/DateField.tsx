import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useMonthTasks } from '@/services/tasks';
import { dotsByDay, formatDayA11y, formatDayTitle, toDateKey } from '@/utils/tasks';

import { MonthCalendar } from '../MonthCalendar';
import { TasksMonthHeader } from '../TasksMonthHeader';
import { FieldError, FieldLabel } from './FieldLabel';

interface DateFieldProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
}

/** Fecha de la tarea: abre el calendario de la pestaña Tareas, con los puntos de prioridad del mes. */
export const DateField: React.FC<DateFieldProps> = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7));
  const today = toDateKey(new Date());
  const tasks = useMonthTasks(month);
  const dots = useMemo(() => dotsByDay(tasks.data ?? []), [tasks.data]);

  const shift = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(toDateKey(new Date(y, m - 1 + delta, 1)).slice(0, 7));
  };

  return (
    <View>
      <FieldLabel icon="calendar-outline" text="Fecha" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Fecha: ${formatDayA11y(value)}. Cambiar`}
        onPress={() => {
          setMonth(value.slice(0, 7));
          setOpen(true);
        }}
        style={{ borderCurve: 'continuous' }}
        className={`h-12 flex-row items-center bg-inputBg border rounded-xl px-3.5 active:opacity-80 ${
          error ? 'border-red-500' : 'border-borderBg'
        }`}
      >
        <Ionicons name="calendar" size={18} color={ThemeColors.primary} />
        <Text className="flex-1 ml-2 text-sm font-semibold text-neutral">{formatDayTitle(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={ThemeColors.mutedText} />
      </Pressable>
      <FieldError message={error} />

      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        header={
          <TasksMonthHeader month={month} onPrev={() => shift(-1)} onNext={() => shift(1)} onPickMonth={setMonth} />
        }
      >
        <MonthCalendar
          month={month}
          selectedDate={value}
          today={today}
          dots={dots}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          onToday={() => {
            onChange(today);
            setOpen(false);
          }}
        />
      </ActionSheet>
    </View>
  );
};
