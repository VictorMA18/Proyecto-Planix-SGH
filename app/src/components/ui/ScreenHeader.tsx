import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/constants/theme';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, right }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top + 8, 16) }}
      className="w-full max-w-[480px] self-center flex-row items-center justify-between px-5 pb-3"
    >
      <View className="w-11 items-start">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onBack}
            hitSlop={4}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-11 h-11 rounded-full bg-cardBg border border-borderBg items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color={ThemeColors.neutral} />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 text-center text-base font-bold text-neutral mx-2"
        >
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}

      <View className="min-w-11 items-end">{right}</View>
    </View>
  );
};
