import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { WEEKDAYS } from './WeekdayChips';

interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  error?: string;
}

/** Selector de días de la semana (varios): cada día es un botón de 44 pt con su nombre completo para lectores de pantalla. */
export const WeekdayPicker: React.FC<WeekdayPickerProps> = ({ value, onChange, error }) => {
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((day) => day !== id) : [...value, id].sort((a, b) => a - b));

  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-neutral mb-1.5">Días aplicables</Text>
      <View className="flex-row justify-between gap-1.5">
        {WEEKDAYS.map((day) => {
          const on = value.includes(day.id);
          return (
            <Pressable
              key={day.id}
              accessibilityRole="checkbox"
              accessibilityLabel={day.name}
              accessibilityState={{ checked: on }}
              onPress={() => toggle(day.id)}
              className={`flex-1 h-11 rounded-xl items-center justify-center active:opacity-75 ${on ? 'bg-primary' : 'bg-tertiary'}`}
            >
              <Text className={`text-sm font-bold ${on ? 'text-white' : 'text-neutral-muted'}`}>{day.letter}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="mt-1.5 ml-1 text-xs font-medium text-red-600">{error}</Text> : null}
    </View>
  );
};
