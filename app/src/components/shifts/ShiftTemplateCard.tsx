import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { UserAvatar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import type { ShiftTemplate } from '@/schemas/attendance.schema';
import { formatHours, formatShiftTime } from '@/utils/attendance';
import { getInitials } from '@/utils/format';

import { WeekdayChips } from './WeekdayChips';

interface ShiftTemplateCardProps {
  template: ShiftTemplate;
  index: number;
  onEdit: () => void;
  onMore: () => void;
}

export const ShiftTemplateCard: React.FC<ShiftTemplateCardProps> = ({ template, index, onEdit, onMore }) => {
  const hours = formatHours(template.horas);
  const preview = template.equipo.slice(0, 3);
  const extra = template.asignados - preview.length;

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-lg shadow-primary/10 gap-4">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-tertiary items-center justify-center mr-3">
          <Text className="text-xl font-extrabold text-primary">{String.fromCharCode(65 + index)}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
              {template.nombre}
            </Text>
            <View className="bg-tertiary rounded-full px-2.5 py-1">
              <Text className="text-[11px] font-bold text-primary">{hours}</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={16} color={ThemeColors.primary} />
            <Text className="ml-1.5 text-sm font-semibold text-neutral">
              {formatShiftTime(template.horaInicio)} – {formatShiftTime(template.horaFin)}
            </Text>
          </View>
        </View>
      </View>

      <View
        accessible
        accessibilityLabel={`Equipo asignado: ${template.asignados} personas`}
        style={{ borderCurve: 'continuous' }}
        className="flex-row items-center justify-between bg-screenBg rounded-xl p-3"
      >
        <Text className="text-sm text-neutral-muted">Equipo asignado</Text>
        <View className="flex-row items-center">
          <View className="flex-row mr-2">
            {preview.map((member, i) => (
              <View key={member.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <UserAvatar initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} size={32} />
              </View>
            ))}
            {extra > 0 ? (
              <View
                style={{ marginLeft: -10 }}
                className="w-8 h-8 rounded-full bg-tertiary border-2 border-white items-center justify-center"
              >
                <Text className="text-[10px] font-bold text-primary">+{extra}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm font-extrabold text-neutral">{template.asignados} asignados</Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm text-neutral-muted">Días aplicables</Text>
        <WeekdayChips days={template.dias} />
      </View>

      <View className="flex-row items-center justify-end gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar parámetros de ${template.nombre}`}
          onPress={onEdit}
          style={{ borderCurve: 'continuous' }}
          className="min-h-11 flex-row items-center bg-tertiary rounded-xl px-4 active:opacity-80"
        >
          <Ionicons name="create-outline" size={18} color={ThemeColors.primary} />
          <Text className="ml-2 text-sm font-bold text-primary">Editar parámetros</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Más opciones de ${template.nombre}`}
          onPress={onMore}
          style={{ borderCurve: 'continuous' }}
          className="w-11 h-11 rounded-xl bg-tertiary items-center justify-center active:opacity-80"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={ThemeColors.primary} />
        </Pressable>
      </View>
    </View>
  );
};
