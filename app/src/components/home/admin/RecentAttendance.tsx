import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip, UserAvatar } from '@/components/ui';
import { ThemeStatus } from '@/constants/theme';
import type { AdminHome } from '@/schemas/home.schema';
import { formatClock12, getInitials } from '@/utils/format';

import { SectionHeader } from '../shared';

interface RecentAttendanceProps {
  records: AdminHome['asistenciasRecientes'];
  onSeeAll: () => void;
}

/** Últimas entradas registradas (personas reales del equipo; los horarios son de ejemplo). */
export const RecentAttendance: React.FC<RecentAttendanceProps> = ({ records, onSeeAll }) => (
  <View className="gap-4">
    <SectionHeader
      title="Asistencias Recientes"
      action={records.length > 0 ? { label: `Ver todos (${records.length})`, onPress: onSeeAll } : undefined}
    />

    {records.length === 0 ? (
      <Text className="text-sm text-neutral-muted">Aún no hay asistencias registradas hoy.</Text>
    ) : (
      <View
        style={{ borderCurve: 'continuous' }}
        className="w-full bg-cardBg rounded-3xl px-4 shadow-sm shadow-primary/10"
      >
        {records.map((record, index) => (
          <View
            key={record.id}
            className={`flex-row items-center py-4 ${index > 0 ? 'border-t border-borderBg' : ''}`}
          >
            <UserAvatar size={44} initials={getInitials(record.nombre)} />
            <View className="flex-1 ml-3">
              <Text numberOfLines={1} className="text-sm font-extrabold text-neutral">
                {record.nombre}
              </Text>
              <Text numberOfLines={1} className="text-xs text-neutral-muted">
                {record.area}
              </Text>
            </View>
            <View className="items-end gap-1">
              <Text className="text-xs font-bold text-neutral">{formatClock12(record.hora)}</Text>
              {record.estado === 'PUNTUAL' ? (
                <StatusChip
                  icon="checkmark-circle"
                  text="Puntual"
                  color={ThemeStatus.success}
                  background={ThemeStatus.successBg}
                />
              ) : (
                <StatusChip
                  icon="time-outline"
                  text={`+${record.minutosTarde} min`}
                  color={ThemeStatus.warningText}
                  background={ThemeStatus.warningBg}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);
