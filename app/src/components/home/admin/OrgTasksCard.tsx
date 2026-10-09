import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ProgressBar, SampleBadge, StatusChip } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import type { HomeTasks } from '@/schemas/home.schema';

/** Avance de las tareas de toda la organización (ejemplo hasta la Fase 3). */
export const OrgTasksCard: React.FC<{ tareas: HomeTasks['organizacion'] }> = ({ tareas }) => {
  const percent = tareas.total > 0 ? (tareas.completadas / tareas.total) * 100 : 0;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center mr-3">
            <Ionicons name="checkbox-outline" size={20} color={ThemeColors.primary} />
          </View>
          <Text className="flex-1 text-[11px] font-bold tracking-wider text-neutral-muted">
            TAREAS DE LA ORGANIZACIÓN
          </Text>
        </View>
        <SampleBadge />
      </View>

      <View className="flex-row flex-wrap items-end justify-between gap-2 mt-4">
        <Text className="text-4xl font-extrabold text-neutral">
          {tareas.completadas}
          <Text className="text-base font-medium text-neutral-muted"> / {tareas.total}</Text>
        </Text>
        <StatusChip
          text={`${Math.round(percent)}% completado`}
          color={ThemeColors.primary}
          background={ThemeColors.tertiary}
        />
      </View>

      <ProgressBar className="mt-4" value={percent} color={ThemeColors.primary} />
    </View>
  );
};
