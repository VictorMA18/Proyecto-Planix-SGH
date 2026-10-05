import React from 'react';
import { View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppLogoHeaderProps {
  title: string;
  subtitle: string;
  showBadge?: boolean;
}

export const AppLogoHeader: React.FC<AppLogoHeaderProps> = ({
  title,
  subtitle,
  showBadge = false,
}) => {
  return (
    <View className="items-center mb-6">
      <View
        style={{ borderCurve: 'continuous' }}
        className="relative w-20 h-20 rounded-[24px] bg-cardBg items-center justify-center mb-4 shadow-md border border-purple-500/15"
      >
        <Image
          source={require('../../../assets/images/Logo_Planix.png')}
          className="w-14 h-14"
          resizeMode="contain"
        />
        {showBadge ? (
          <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary items-center justify-center border-2 border-white">
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <Text
        accessibilityRole="header"
        className="text-3xl font-extrabold text-neutral text-center mb-2 tracking-tight"
      >
        {title}
      </Text>
      <Text className="text-base text-neutral-muted text-center max-w-[300px] leading-6 font-sans">
        {subtitle}
      </Text>
    </View>
  );
};
