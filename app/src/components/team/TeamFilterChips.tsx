import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { TeamCounts, TeamFilter } from '@/schemas/team.schema';

const FILTERS: { value: TeamFilter; label: string; count: keyof TeamCounts }[] = [
  { value: 'TODOS', label: 'Todos', count: 'todos' },
  { value: 'ADMIN', label: 'Admins', count: 'admins' },
  { value: 'SUPERVISOR', label: 'Supervisores', count: 'supervisores' },
  { value: 'EMPLEADO', label: 'Empleados', count: 'empleados' },
  { value: 'PENDIENTES', label: 'Pendientes', count: 'pendientes' },
];

interface TeamFilterChipsProps {
  value: TeamFilter;
  counts?: TeamCounts;
  onChange: (filter: TeamFilter) => void;
}

export const TeamFilterChips: React.FC<TeamFilterChipsProps> = ({ value, counts, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="-mx-5 flex-grow-0"
    contentContainerClassName="px-5 gap-2"
    accessibilityRole="tablist"
  >
    {FILTERS.map((filter) => {
      const selected = filter.value === value;
      return (
        <Pressable
          key={filter.value}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={`${filter.label}${counts ? `, ${counts[filter.count]}` : ''}`}
          onPress={() => onChange(filter.value)}
          style={{ borderCurve: 'continuous' }}
          className={`min-h-11 flex-row items-center rounded-full px-4 active:opacity-75 ${
            selected ? 'bg-tertiary' : 'bg-cardBg'
          }`}
        >
          <Text className={`text-sm ${selected ? 'font-bold text-primary' : 'font-medium text-neutral'}`}>
            {filter.label}
          </Text>
          {counts ? (
            <View
              className={`ml-2 rounded-full px-2 py-0.5 ${selected ? 'bg-primary/15' : 'bg-tertiary'}`}
            >
              <Text className={`text-[11px] font-bold ${selected ? 'text-primary' : 'text-neutral-muted'}`}>
                {counts[filter.count]}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    })}
  </ScrollView>
);
