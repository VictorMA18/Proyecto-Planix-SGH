import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/theme';

interface AppHeaderBarProps {
  leftButton?: {
    text: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  rightBadge?: {
    text: string;
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    dot?: boolean;
  };
}

export const AppHeaderBar: React.FC<AppHeaderBarProps> = ({ leftButton, rightBadge }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top + 6, 14) }}
      className="w-full max-w-[480px] self-center flex-row justify-between items-center px-6 pb-3"
    >
      {leftButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={leftButton.text}
          className="flex-row items-center bg-tertiary px-4 py-2 rounded-full shadow-sm"
          onPress={leftButton.onPress}
          style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
        >
          <View className="mr-2">
            <Ionicons
              name={leftButton.icon || 'arrow-back'}
              size={16}
              color={ThemeColors.primary}
            />
          </View>
          <Text className="text-sm font-semibold text-primary font-sans">
            {leftButton.text}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}

      {rightBadge ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rightBadge.text}
          className="flex-row items-center bg-tertiary px-4 py-2 rounded-full shadow-sm"
          onPress={rightBadge.onPress}
          disabled={!rightBadge.onPress}
          style={({ pressed }) => [
            { borderCurve: 'continuous' },
            rightBadge.onPress ? { opacity: pressed ? 0.75 : 1 } : {},
          ]}
        >
          {rightBadge.dot ? (
            <View className="w-2 h-2 rounded-full bg-primary mr-2" />
          ) : null}
          {rightBadge.icon ? (
            <View className="mr-2">
              <Ionicons
                name={rightBadge.icon}
                size={16}
                color={ThemeColors.secondary}
              />
            </View>
          ) : null}
          <Text className="text-sm font-semibold text-secondary font-sans">
            {rightBadge.text}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
};
