import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip, UserAvatar } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { AdminHome } from '@/schemas/home.schema';
import { formatClock12, getInitials } from '@/utils/format';

import { SectionHeader } from '../shared';

interface RecentAttendanceProps {
  records: AdminHome['asistenciasRecientes'];
  /** Solo el ADMIN tiene reporte. */
  onSeeAll?: () => void;
}

/** Últimas primeras entradas de hoy, con su puntualidad. */
export const RecentAttendance: React.FC<RecentAttendanceProps> = ({ records, onSeeAll }) => (
  <View className="gap-4">
    <SectionHeader
      title="Asistencias Recientes"
      action={onSeeAll ? { label: 'Ver reporte', onPress: onSeeAll } : undefined}
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
            <UserAvatar size={44} initials={getInitials(record.nombre)} uri={record.avatarUrl ?? undefined} />
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
              ) : record.estado === 'TARDE' ? (
                <StatusChip
                  icon="time-outline"
                  text={`+${record.minutosTarde ?? 0} min`}
                  color={ThemeStatus.warningText}
                  background={ThemeStatus.warningBg}
                />
              ) : (
                <StatusChip text="Sin turno" color={ThemeColors.mutedText} background={ThemeColors.tertiary} />
              )}
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);
