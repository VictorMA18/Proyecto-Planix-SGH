import React from 'react';
import { Text, View } from 'react-native';

import { ActionSheet } from '@/components/ui';
import { TASK_DOT, TASK_PRIORITY_FILTERS } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import type { TaskPriorityFilter } from '@/schemas/task.schema';

import { OptionRow } from './OptionRow';

const DOT_COLOR: Record<TaskPriorityFilter, string> = {
  TODAS: ThemeColors.border,
  ALTA: TASK_DOT.urgent,
  MEDIA: TASK_DOT.normal,
  BAJA: TASK_DOT.low,
};

interface PriorityFilterSheetProps {
  visible: boolean;
  value: TaskPriorityFilter;
  onChange: (value: TaskPriorityFilter) => void;
  onClose: () => void;
}

export const PriorityFilterSheet: React.FC<PriorityFilterSheetProps> = ({ visible, value, onChange, onClose }) => (
  <ActionSheet
    visible={visible}
    onClose={onClose}
    header={
      <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
        Filtrar por prioridad
      </Text>
    }
  >
    <View accessibilityRole="radiogroup" className="gap-1">
      {TASK_PRIORITY_FILTERS.map((option) => (
        <OptionRow
          key={option.value}
          label={option.label}
          selected={option.value === value}
          leading={<View style={{ backgroundColor: DOT_COLOR[option.value] }} className="w-3 h-3 rounded-full" />}
          onPress={() => {
            onChange(option.value);
            onClose();
          }}
        />
      ))}
    </View>
  </ActionSheet>
);
