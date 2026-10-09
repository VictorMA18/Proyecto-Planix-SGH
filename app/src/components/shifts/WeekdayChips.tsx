import React from 'react';
import { Text, View } from 'react-native';

export const WEEKDAYS = [
  { id: 1, letter: 'L', name: 'lunes' },
  { id: 2, letter: 'M', name: 'martes' },
  { id: 3, letter: 'X', name: 'miércoles' },
  { id: 4, letter: 'J', name: 'jueves' },
  { id: 5, letter: 'V', name: 'viernes' },
  { id: 6, letter: 'S', name: 'sábado' },
  { id: 7, letter: 'D', name: 'domingo' },
] as const;

/** Días de la semana aplicables; el estado se lee con texto, no solo con color. */
export const WeekdayChips: React.FC<{ days: number[] }> = ({ days }) => {
  const active = WEEKDAYS.filter((day) => days.includes(day.id));

  return (
    <View
      accessible
      accessibilityLabel={`Días aplicables: ${active.map((day) => day.name).join(', ')}`}
      className="flex-row items-center justify-between gap-2"
    >
      {WEEKDAYS.map((day) => {
        const on = days.includes(day.id);
        return (
          <View
            key={day.id}
            className={`flex-1 max-w-9 h-9 rounded-lg items-center justify-center ${on ? 'bg-primary' : 'bg-tertiary'}`}
          >
            <Text className={`text-sm font-bold ${on ? 'text-white' : 'text-neutral-muted'}`}>{day.letter}</Text>
          </View>
        );
      })}
    </View>
  );
};
