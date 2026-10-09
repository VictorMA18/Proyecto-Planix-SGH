import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { SampleBadge, StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { HomeTask, TaskPriority } from '@/schemas/home.schema';
import { formatClock12 } from '@/utils/format';

import { SectionHeader } from '../shared';

const PRIORITY: Record<TaskPriority, { text: string; color: string; background: string }> = {
  ALTA: { text: 'Alta', color: ThemeStatus.errorText, background: ThemeStatus.errorBg },
  MEDIA: { text: 'Media', color: ThemeStatus.warningText, background: ThemeStatus.warningBg },
  BAJA: { text: 'Baja', color: ThemeStatus.success, background: ThemeStatus.successBg },
};

const TaskItem: React.FC<{ task: HomeTask }> = ({ task }) => {
  const done = task.estado === 'COMPLETADA';

  return (
    <View
      accessible
      accessibilityLabel={`${task.titulo}. ${done ? 'Completada' : `Prioridad ${PRIORITY[task.prioridad].text}`}`}
      style={{ borderCurve: 'continuous' }}
      className={`w-full rounded-3xl p-4 ${done ? 'bg-cardBg/60' : 'bg-cardBg shadow-sm shadow-primary/10'}`}
    >
      <View className="flex-row items-start">
        <View
          style={done ? { backgroundColor: ThemeStatus.success } : undefined}
          className={`w-6 h-6 rounded-md items-center justify-center mr-3 mt-0.5 ${done ? '' : 'bg-tertiary'}`}
        >
          {done ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              numberOfLines={1}
              className={`flex-1 text-base font-extrabold ${done ? 'text-neutral-muted line-through' : 'text-neutral'}`}
            >
              {task.titulo}
            </Text>
            {done ? (
              <StatusChip text="Completada" color={ThemeColors.mutedText} background={ThemeColors.tertiary} />
            ) : (
              <StatusChip {...PRIORITY[task.prioridad]} />
            )}
          </View>

          {done ? (
            <Text className="mt-1 text-xs text-neutral-muted">
              Finalizada a las {task.completadaEn ? formatClock12(task.completadaEn) : '—'}
              {task.participantes ? ` con ${task.participantes} participantes.` : '.'}
            </Text>
          ) : (
            <>
              <Text numberOfLines={2} className="mt-1 text-sm text-neutral-muted">
                {task.descripcion}
              </Text>
              <View className="flex-row items-center mt-3">
                <Ionicons name="time-outline" size={14} color={ThemeColors.primary} />
                <Text className="ml-1.5 text-xs font-semibold text-neutral-muted">
                  {task.estimadoMin ? `Est. ${task.estimadoMin} min` : 'Sin estimado'}
                  {task.venceEn ? ` • Vence ${formatClock12(task.venceEn)}` : ''}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

/** Tareas de hoy: primero las pendientes y al final las completadas. */
export const TodayTasks: React.FC<{ tasks: HomeTask[] }> = ({ tasks }) => {
  const pending = tasks.filter((task) => task.estado === 'PENDIENTE').length;
  const ordered = [...tasks].sort((a, b) => Number(a.estado === 'COMPLETADA') - Number(b.estado === 'COMPLETADA'));

  return (
    <View className="gap-4">
      <SectionHeader
        title="Tareas de hoy"
        badge={pending === 0 ? 'Todo al día' : `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`}
      />
      {/* Las tareas llegan con la Fase 3: hasta entonces son de ejemplo. */}
      <View className="flex-row -mt-2">
        <SampleBadge />
      </View>
      {ordered.length === 0 ? (
        <Text className="text-sm text-neutral-muted">No tienes tareas asignadas para hoy.</Text>
      ) : (
        ordered.map((task) => <TaskItem key={task.id} task={task} />)
      )}
    </View>
  );
};
