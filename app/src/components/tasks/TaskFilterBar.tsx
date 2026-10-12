import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface FilterChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ icon, label, active, onPress, accessibilityLabel }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className={`min-h-11 flex-row items-center rounded-full px-4 active:opacity-75 ${
      active ? 'bg-primary' : 'bg-tertiary'
    }`}
  >
    <Ionicons name={icon} size={16} color={active ? '#FFFFFF' : ThemeColors.primary} />
    <Text numberOfLines={1} className={`ml-2 max-w-[160px] text-sm font-bold ${active ? 'text-white' : 'text-primary'}`}>
      {label}
    </Text>
    <Ionicons name="chevron-down" size={14} color={active ? '#FFFFFF' : ThemeColors.primary} style={{ marginLeft: 4 }} />
  </Pressable>
);

interface TaskFilterBarProps {
  /** Nombre del miembro elegido (`null` = todos). */
  memberLabel: string | null;
  memberActive: boolean;
  priorityLabel: string;
  priorityActive: boolean;
  onMemberPress: () => void;
  onPriorityPress: () => void;
  onClear: () => void;
}

/** Filtros de la pantalla: miembro y prioridad. El estado va en pestañas aparte. */
export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  memberLabel,
  memberActive,
  priorityLabel,
  priorityActive,
  onMemberPress,
  onPriorityPress,
  onClear,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="-mx-5 flex-grow-0"
    contentContainerClassName="px-5 gap-2"
  >
    <FilterChip
      icon="people-outline"
      label={memberLabel ?? 'Todos los miembros'}
      active={memberActive}
      onPress={onMemberPress}
      accessibilityLabel={`Filtrar por miembro: ${memberLabel ?? 'todos los miembros'}`}
    />
    <FilterChip
      icon="flag-outline"
      label={priorityLabel}
      active={priorityActive}
      onPress={onPriorityPress}
      accessibilityLabel={`Filtrar por prioridad: ${priorityLabel}`}
    />
    {memberActive || priorityActive ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quitar filtros"
        onPress={onClear}
        className="min-h-11 flex-row items-center rounded-full px-3 active:opacity-70"
      >
        <Ionicons name="close-circle" size={18} color={ThemeColors.mutedText} />
        <Text className="ml-1 text-sm font-semibold text-neutral-muted">Quitar filtros</Text>
      </Pressable>
    ) : null}
  </ScrollView>
);
