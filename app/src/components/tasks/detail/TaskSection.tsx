import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface TaskSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Texto o control a la derecha del título (p. ej. «3 de 5 completadas»). */
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

/** Tarjeta de una sección del detalle o del formulario de una tarea. */
export const TaskSection: React.FC<TaskSectionProps> = ({ icon, title, trailing, children }) => (
  <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10 gap-4">
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1 flex-row items-center">
        <Ionicons name={icon} size={16} color={ThemeColors.primary} />
        <Text accessibilityRole="header" className="ml-2 text-xs font-extrabold tracking-wider text-neutral-muted">
          {title.toUpperCase()}
        </Text>
      </View>
      {typeof trailing === 'string' ? (
        <Text className="text-xs font-bold text-primary">{trailing}</Text>
      ) : (
        trailing
      )}
    </View>
    {children}
  </View>
);
