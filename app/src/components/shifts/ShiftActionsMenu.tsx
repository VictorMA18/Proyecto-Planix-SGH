import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ActionSheet, ActionSheetItem } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import type { ShiftTemplate } from '@/schemas/attendance.schema';
import { formatShiftTime } from '@/utils/attendance';

interface ShiftActionsMenuProps {
  template: ShiftTemplate | null;
  onClose: () => void;
  onViewDetail: (template: ShiftTemplate) => void;
  onDelete: (template: ShiftTemplate) => void;
}

/** Menú ⋮ de cada plantilla: ver detalle o eliminarla. */
export const ShiftActionsMenu: React.FC<ShiftActionsMenuProps> = ({ template, onClose, onViewDetail, onDelete }) => {
  if (!template) return null;

  return (
    <ActionSheet
      visible
      onClose={onClose}
      header={
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-tertiary items-center justify-center">
            <Ionicons name="time-outline" size={24} color={ThemeColors.primary} />
          </View>
          <View className="flex-1 ml-3">
            <Text numberOfLines={1} className="text-base font-extrabold text-neutral">
              {template.nombre}
            </Text>
            <Text className="text-sm text-neutral-muted">
              {formatShiftTime(template.horaInicio)} – {formatShiftTime(template.horaFin)}
            </Text>
          </View>
        </View>
      }
    >
      <ActionSheetItem
        icon="eye-outline"
        label="Ver detalle"
        description="Horario, días y equipo asignado"
        onPress={() => onViewDetail(template)}
      />
      <ActionSheetItem
        icon="trash-outline"
        label="Eliminar plantilla"
        description="Las personas asignadas quedan sin turno"
        destructive
        onPress={() => onDelete(template)}
      />
    </ActionSheet>
  );
};
