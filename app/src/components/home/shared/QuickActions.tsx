import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, subtitle, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}
    onPress={onPress}
    style={{ borderCurve: 'continuous' }}
    className="flex-1 min-h-16 flex-row items-center bg-cardBg rounded-2xl p-3 shadow-sm shadow-primary/10 active:opacity-80"
  >
    <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center mr-3">
      <Ionicons name={icon} size={20} color={ThemeColors.primary} />
    </View>
    <View className="flex-1">
      <Text numberOfLines={1} className="text-sm font-extrabold text-neutral">
        {title}
      </Text>
      <Text numberOfLines={1} className="text-xs text-neutral-muted">
        {subtitle}
      </Text>
    </View>
  </Pressable>
);

interface QuickActionsProps {
  onNewTask: () => void;
  onBroadcast: () => void;
}

/** Accesos rápidos de supervisores y administradores: nueva tarea y difundir aviso. */
export const QuickActions: React.FC<QuickActionsProps> = ({ onNewTask, onBroadcast }) => (
  <View className="flex-row gap-3">
    <QuickAction icon="add-circle-outline" title="Nueva tarea" subtitle="Asignar turno" onPress={onNewTask} />
    <QuickAction icon="megaphone-outline" title="Difundir aviso" subtitle="Push masivo" onPress={onBroadcast} />
  </View>
);
