import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TASK_DOT } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import { dayMarks, formatDayA11y, formatShortDay, monthGrid, type DayDots } from '@/utils/tasks';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface MonthCalendarProps {
  month: string;
  selectedDate: string;
  today: string;
  dots: Map<string, DayDots>;
  onSelect: (date: string) => void;
  onToday: () => void;
}

/** Calendario del mes: puntos por prioridad (urgente, normal y baja), el día elegido y acceso a «Hoy». */
export const MonthCalendar: React.FC<MonthCalendarProps> = ({ month, selectedDate, today, dots, onSelect, onToday }) => {
  const weeks = monthGrid(month);

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-4 shadow-lg shadow-primary/10"
    >
      <View className="flex-row" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {WEEKDAYS.map((day, i) => (
          <Text
            key={day + i}
            className={`flex-1 text-center text-xs font-bold ${i >= 5 ? 'text-red-500' : 'text-neutral-muted'}`}
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="mt-2 gap-1">
        {weeks.map((week) => (
          <View key={week[0].key} className="flex-row">
            {week.map((day) => {
              const selected = day.key === selectedDate;
              const isToday = day.key === today;
              const counts = dots.get(day.key);
              const total = counts ? counts.urgent + counts.normal + counts.low : 0;
              const marks = dayMarks(counts).map((kind) => TASK_DOT[kind]);

              return (
                <Pressable
                  key={day.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${formatDayA11y(day.key)}${isToday ? ', hoy' : ''}. ${
                    total === 0 ? 'Sin tareas' : `${total} ${total === 1 ? 'tarea' : 'tareas'}`
                  }${counts?.urgent ? `, ${counts.urgent} urgente${counts.urgent === 1 ? '' : 's'}` : ''}${
                    counts?.low ? `, ${counts.low} de prioridad baja` : ''
                  }`}
                  onPress={() => onSelect(day.key)}
                  className="flex-1 items-center py-0.5"
                >
                  {/* Radio y colores en `style`, fondo nunca transparente y `key` para remontar al
                      seleccionar: en Android, una vista sin fondo que luego recibe color pierde el
                      redondeado y el día quedaba como un cuadrado. */}
                  <View
                    key={selected ? 'on' : 'off'}
                    style={{
                      borderCurve: 'continuous',
                      borderRadius: 16,
                      backgroundColor: selected ? ThemeColors.primary : ThemeColors.cardBg,
                      borderColor: selected
                        ? ThemeColors.primary
                        : isToday
                          ? `${ThemeColors.primary}66`
                          : ThemeColors.cardBg,
                    }}
                    className="w-full max-w-[44px] h-12 border-2 items-center justify-center"
                  >
                    <Text
                      className={`text-sm ${
                        selected
                          ? 'font-extrabold text-white'
                          : day.inMonth
                            ? 'font-semibold text-neutral'
                            : 'text-neutral-muted/50'
                      }`}
                    >
                      {day.day}
                    </Text>
                    <View className="flex-row gap-0.5 mt-1 h-1.5">
                      {marks.map((color, i) => (
                        <View
                          key={i}
                          style={{ backgroundColor: selected ? '#FFFFFF' : color, opacity: day.inMonth ? 1 : 0.4 }}
                          className="w-1.5 h-1.5 rounded-full"
                        />
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-borderBg">
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <View className="flex-row items-center">
            <View style={{ backgroundColor: TASK_DOT.normal }} className="w-2 h-2 rounded-full mr-1.5" />
            <Text className="text-xs text-neutral-muted">Normal</Text>
          </View>
          <View className="flex-row items-center">
            <View style={{ backgroundColor: TASK_DOT.urgent }} className="w-2 h-2 rounded-full mr-1.5" />
            <Text className="text-xs text-neutral-muted">Urgente</Text>
          </View>
          <View className="flex-row items-center">
            <View style={{ backgroundColor: TASK_DOT.low }} className="w-2 h-2 rounded-full mr-1.5" />
            <Text className="text-xs text-neutral-muted">Baja</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ir a hoy, ${formatDayA11y(today)}`}
          onPress={onToday}
          style={{ borderCurve: 'continuous' }}
          className="min-h-11 flex-row items-center bg-tertiary rounded-xl px-3 active:opacity-75"
        >
          <Ionicons name="calendar-outline" size={16} color={ThemeColors.primary} />
          <Text className="ml-1.5 text-xs font-bold text-primary">Hoy: {formatShortDay(today)}</Text>
        </Pressable>
      </View>
    </View>
  );
};
