import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

export interface DescriptionToolbarState {
  bold: boolean;
  italic: boolean;
  list: boolean;
  link: boolean;
  canUndo: boolean;
}

interface DescriptionToolbarProps {
  state: DescriptionToolbarState;
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
  onLink: () => void;
  onUndo: () => void;
}

interface ToolProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

/**
 * Botón de la barra. El fondo y el radio van en el `style` de un View interno que se remonta al
 * cambiar (`key`) y nunca es transparente: en Android, si no, pierde el redondeado.
 */
const Tool: React.FC<ToolProps> = ({ label, active = false, disabled = false, onPress, children }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected: active, disabled }}
    disabled={disabled}
    onPress={onPress}
    className="active:opacity-70"
  >
    <View
      key={active ? 'on' : 'off'}
      style={{
        borderCurve: 'continuous',
        borderRadius: 12,
        backgroundColor: active ? ThemeColors.tertiary : ThemeColors.cardBg,
        ...(disabled ? { opacity: 0.35 } : null),
      }}
      className="w-11 h-11 items-center justify-center"
    >
      {children}
    </View>
  </Pressable>
);

/** Negrita, cursiva, lista, enlace y deshacer. Los activos se resaltan según la selección. */
export const DescriptionToolbar: React.FC<DescriptionToolbarProps> = ({
  state,
  onBold,
  onItalic,
  onList,
  onLink,
  onUndo,
}) => {
  const color = (active: boolean) => (active ? ThemeColors.primary : ThemeColors.neutral);

  return (
    <View className="flex-row items-center gap-1">
      <Tool label="Negrita" active={state.bold} onPress={onBold}>
        <Text style={{ color: color(state.bold), fontFamily: 'DMSans_800ExtraBold' }} className="text-base">
          B
        </Text>
      </Tool>
      <Tool label="Cursiva" active={state.italic} onPress={onItalic}>
        <Text style={{ color: color(state.italic), fontFamily: 'DMSans_700Bold_Italic' }} className="text-base">
          I
        </Text>
      </Tool>
      <Tool label="Lista con viñetas" active={state.list} onPress={onList}>
        <Ionicons name="list" size={18} color={color(state.list)} />
      </Tool>
      <Tool label={state.link ? 'Quitar enlace' : 'Agregar enlace'} active={state.link} onPress={onLink}>
        <Ionicons name={state.link ? 'unlink' : 'link'} size={18} color={color(state.link)} />
      </Tool>

      <View className="flex-1" />
      <View className="w-px h-6 bg-borderBg mr-1" />
      <Tool label="Deshacer la última acción" disabled={!state.canUndo} onPress={onUndo}>
        <Ionicons name="arrow-undo-outline" size={18} color={ThemeColors.neutral} />
      </Tool>
    </View>
  );
};
