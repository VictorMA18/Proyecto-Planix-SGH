import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { ThemeColors } from '@/constants/theme';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB = 24;
const PADDING = (TRACK_HEIGHT - THUMB) / 2;
const TRAVEL = TRACK_WIDTH - THUMB - PADDING * 2;

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/**
 * Interruptor con el estilo de la app (pista morada y círculo blanco), igual en Android, iOS y web.
 * Las medidas y colores van en `style`: no dependen de clases de NativeWind que cambien.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onValueChange, accessibilityLabel, disabled }) => {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value, progress]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          padding: PADDING,
          justifyContent: 'center',
          backgroundColor: progress.interpolate({ inputRange: [0, 1], outputRange: ['#D4D0E0', ThemeColors.primary] }),
        }}
      >
        <Animated.View
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000000',
            shadowOpacity: 0.15,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
};
