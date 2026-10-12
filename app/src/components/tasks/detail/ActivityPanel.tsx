import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { TaskActivity } from '@/schemas/task.schema';
import { useTaskActivity } from '@/services/tasks';
import { formatAgo } from '@/utils/tasks';

const ICON: Record<TaskActivity['tipo'], keyof typeof Ionicons.glyphMap> = {
  CREADA: 'add-circle-outline',
  EDITADA: 'create-outline',
  ESTADO: 'swap-horizontal-outline',
  ASIGNADOS: 'people-outline',
  SUBTAREA: 'checkbox-outline',
  COMENTARIO: 'chatbubble-outline',
  ADJUNTO: 'attach-outline',
  DUPLICADA: 'copy-outline',
};

/** Historial de la tarea, del más reciente al más antiguo, con la misma línea de tiempo de Asistencia. */
export const ActivityPanel: React.FC<{ taskId: string }> = ({ taskId }) => {
  const activity = useTaskActivity(taskId);

  if (activity.isPending) return <ActivityIndicator color={ThemeColors.primary} />;
  if (activity.isError) return <Text className="text-sm text-neutral-muted">No pudimos cargar la actividad.</Text>;
  if (activity.data.length === 0) {
    return <Text className="text-sm text-neutral-muted">Todavía no hay actividad registrada.</Text>;
  }

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10">
      {activity.data.map((event, index) => (
        <View
          key={event.id}
          accessible
          accessibilityLabel={`${event.actor.nombre} ${event.descripcion}, ${formatAgo(event.createdAt)}`}
          className="flex-row"
        >
          <View className="items-center mr-3">
            <View className="w-9 h-9 rounded-full bg-tertiary items-center justify-center">
              <Ionicons name={ICON[event.tipo]} size={16} color={ThemeColors.primary} />
            </View>
            {index < activity.data.length - 1 ? <View className="w-0.5 flex-1 min-h-3 bg-tertiary my-1" /> : null}
          </View>
          <View className={`flex-1 ${index < activity.data.length - 1 ? 'pb-4' : ''}`}>
            <Text className="text-sm text-neutral">
              <Text className="font-extrabold">{event.actor.nombre}</Text> {event.descripcion}
            </Text>
            <Text className="mt-0.5 text-xs text-neutral-muted">{formatAgo(event.createdAt)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};
