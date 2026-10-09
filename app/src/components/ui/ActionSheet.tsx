import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors, ThemeStatus } from '@/constants/theme';

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Contenido sobre las acciones (quién o qué se está gestionando). */
  header: React.ReactNode;
  children: React.ReactNode;
}

/** Hoja inferior con las acciones de un elemento (menú ⋮). */
export const ActionSheet: React.FC<ActionSheetProps> = ({ visible, onClose, header, children }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{ borderCurve: 'continuous', paddingBottom: Math.max(insets.bottom, 0) + 20 }}
          className="w-full max-w-[480px] self-center bg-cardBg rounded-t-3xl px-5 pt-5"
        >
          <View className="mb-4 px-1">{header}</View>
          <View className="gap-1 border-t border-borderBg pt-3">{children}</View>
        </View>
      </View>
    </Modal>
  );
};

interface ActionSheetItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  destructive?: boolean;
  onPress: () => void;
}

export const ActionSheetItem: React.FC<ActionSheetItemProps> = ({ icon, label, description, destructive, onPress }) => {
  const color = destructive ? ThemeStatus.errorText : ThemeColors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      onPress={onPress}
      style={{ borderCurve: 'continuous' }}
      className="min-h-16 flex-row items-center rounded-2xl px-3 active:bg-tertiary"
    >
      <View
        style={{ backgroundColor: destructive ? ThemeStatus.errorBg : ThemeColors.tertiary }}
        className="w-11 h-11 rounded-xl items-center justify-center mr-3"
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text
          style={destructive ? { color: ThemeStatus.errorText } : undefined}
          className="text-base font-bold text-neutral"
        >
          {label}
        </Text>
        <Text className="text-xs text-neutral-muted">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={ThemeColors.mutedText} />
    </Pressable>
  );
};
