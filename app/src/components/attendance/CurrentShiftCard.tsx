import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { WeekdayChips } from '@/components/shifts/WeekdayChips';
import { StatusChip, UserAvatar } from '@/components/ui';
import { SHIFT_STATUS } from '@/constants/attendance';
import { ThemeColors } from '@/constants/theme';
import type { AttendanceToday } from '@/schemas/attendance.schema';
import { formatHours, formatShiftTime, shiftStatus } from '@/utils/attendance';
import { getInitials } from '@/utils/format';

interface CurrentShiftCardProps {
  today: AttendanceToday;
  now: number;
  onDetail: () => void;
}

/**
 * «Mi turno» en Asistencia (todos los roles): la plantilla asignada con su horario, en qué punto
 * está hoy, el equipo y los días. Rediseño de `ShiftTemplateCard` con una sola acción, «Ver
 * detalle», a todo el ancho.
 */
export const CurrentShiftCard: React.FC<CurrentShiftCardProps> = ({ today, now, onDetail }) => {
  const template = today.plantilla;

  if (!template) {
    return (
      <View
        style={{ borderCurve: 'continuous' }}
        className="w-full flex-row items-center bg-cardBg rounded-3xl p-5 shadow-lg shadow-primary/10"
      >
        <View className="w-12 h-12 rounded-2xl bg-tertiary items-center justify-center mr-3">
          <Ionicons name="calendar-clear-outline" size={22} color={ThemeColors.primary} />
        </View>
        <View className="flex-1">
          <Text accessibilityRole="header" className="text-base font-extrabold text-neutral">
            Sin turno asignado
          </Text>
          <Text className="text-sm text-neutral-muted">
            Un administrador debe asignarte un turno para medir tu puntualidad.
          </Text>
        </View>
      </View>
    );
  }

  const status = SHIFT_STATUS[shiftStatus(today.turno, now)];
  const preview = template.equipo.slice(0, 3);
  const extra = template.asignados - preview.length;

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-lg shadow-primary/10 gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-xs font-bold tracking-widest text-neutral-muted">MI TURNO</Text>
        <StatusChip icon={status.icon} text={status.label} color={status.color} background={status.background} />
      </View>

      <View className="flex-row items-center">
        <View style={{ borderCurve: 'continuous' }} className="w-14 h-14 rounded-2xl bg-primary items-center justify-center mr-3">
          <Ionicons name="time" size={26} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
              {template.nombre}
            </Text>
            <View className="bg-tertiary rounded-full px-2.5 py-1">
              <Text className="text-[11px] font-bold text-primary">{formatHours(template.horas)}</Text>
            </View>
          </View>
          <Text className="mt-0.5 text-base font-semibold text-neutral">
            {formatShiftTime(template.horaInicio)} – {formatShiftTime(template.horaFin)}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold text-neutral-muted">Días aplicables</Text>
        <WeekdayChips days={template.dias} />
      </View>

      <View
        accessible
        accessibilityLabel={`Equipo del turno: ${template.asignados} ${template.asignados === 1 ? 'persona' : 'personas'}`}
        style={{ borderCurve: 'continuous' }}
        className="flex-row items-center justify-between bg-screenBg rounded-xl p-3"
      >
        <Text className="text-sm text-neutral-muted">Equipo del turno</Text>
        <View className="flex-row items-center">
          <View className="flex-row mr-2">
            {preview.map((member, i) => (
              <View key={member.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <UserAvatar initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} size={28} />
              </View>
            ))}
            {extra > 0 ? (
              <View
                style={{ marginLeft: -10 }}
                className="w-7 h-7 rounded-full bg-tertiary border-2 border-white items-center justify-center"
              >
                <Text className="text-[10px] font-bold text-primary">+{extra}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm font-extrabold text-neutral">{template.asignados}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ${template.nombre}`}
        onPress={onDetail}
        style={{ borderCurve: 'continuous' }}
        className="min-h-12 flex-row items-center justify-center rounded-2xl bg-tertiary px-4 active:opacity-80"
      >
        <Ionicons name="document-text-outline" size={18} color={ThemeColors.primary} />
        <Text className="ml-2 text-sm font-bold text-primary">Ver detalle</Text>
        <Ionicons name="chevron-forward" size={16} color={ThemeColors.primary} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
};
