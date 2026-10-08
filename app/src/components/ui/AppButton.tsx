import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  rightArrow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  rightArrow = false,
  style,
}) => {
  // 'primary' y 'danger' son botones sólidos con texto blanco; 'secondary' es el botón claro.
  const isPrimary = variant !== 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || isLoading), busy: !!isLoading }}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        { borderCurve: 'continuous' },
        style,
      ]}
      className={`w-full py-3.5 px-6 rounded-2xl items-center justify-center ${
        variant === 'danger'
          ? 'bg-red-600 shadow-lg shadow-red-600/30'
          : isPrimary
            ? 'bg-primary shadow-lg shadow-primary/30'
            : 'bg-tertiary'
      } ${disabled || isLoading ? 'opacity-60' : ''}`}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center justify-center ${
            pressed ? 'opacity-80' : 'opacity-100'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color={isPrimary ? '#FFFFFF' : ThemeColors.neutral} />
          ) : (
            <>
              {icon ? (
                <View className="mr-2">
                  <Ionicons
                    name={icon}
                    size={20}
                    color={isPrimary ? '#FFFFFF' : ThemeColors.neutral}
                  />
                </View>
              ) : null}
              <Text
                className={`font-bold ${
                  isPrimary ? 'text-white text-base' : 'text-neutral text-base'
                }`}
              >
                {title}
              </Text>
              {rightArrow ? (
                <View className="ml-2">
                  <Ionicons
                    name="arrow-forward-outline"
                    size={20}
                    color={isPrimary ? '#FFFFFF' : ThemeColors.neutral}
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
};
