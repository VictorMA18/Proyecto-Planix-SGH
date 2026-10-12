import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TASK_STATUS } from '@/constants/tasks';
import { ThemeColors } from '@/constants/theme';
import { taskStatusSchema, type TaskStatus } from '@/schemas/task.schema';

interface TaskStatusStepperProps {
  value: TaskStatus;
  /** Sin `onChange` es solo de lectura (quien no gestiona ni está asignado). */
  onChange?: (status: TaskStatus) => void;
  disabled?: boolean;
}

/** Flujo de la tarea: Por hacer → Progreso → Revisión → Completada. */
export const TaskStatusStepper: React.FC<TaskStatusStepperProps> = ({ value, onChange, disabled }) => (
  <View
    accessibilityRole="radiogroup"
    accessibilityLabel="Estado de la tarea"
    style={{ borderCurve: 'continuous' }}
    className="flex-row bg-tertiary rounded-2xl p-1"
  >
    {taskStatusSchema.options.map((status) => {
      const selected = status === value;
      return (
        <Pressable
          key={status}
          accessibilityRole="radio"
          accessibilityState={{ selected, disabled: !onChange || disabled }}
          accessibilityLabel={TASK_STATUS[status].label}
          disabled={!onChange || disabled}
          onPress={() => onChange?.(status)}
          className="flex-1 active:opacity-80"
        >
          {/* Las clases no cambian al elegir: alternar `shadow-*` en tiempo de ejecución hace que
              NativeWind reestructure el componente y React falla por el orden de los hooks. Lo que
              cambia (fondo, borde y elevación) va en `style`. */}
          <View
            style={[styles.segment, selected ? styles.selected : styles.idle]}
            className="min-h-11 flex-row items-center justify-center rounded-xl px-1 border"
          >
            {selected ? <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" /> : null}
            <Text
              numberOfLines={1}
              className={`text-xs ${selected ? 'font-extrabold text-primary' : 'font-semibold text-neutral-muted'}`}
            >
              {TASK_STATUS[status].step}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  segment: { borderCurve: 'continuous' },
  idle: { backgroundColor: 'transparent', borderColor: 'transparent' },
  selected: {
    backgroundColor: ThemeColors.cardBg,
    borderColor: 'rgba(107, 70, 193, 0.4)',
    shadowColor: ThemeColors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
