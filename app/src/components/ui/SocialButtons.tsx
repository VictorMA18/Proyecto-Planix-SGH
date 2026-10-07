import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { GoogleLogo } from './GoogleLogo';

interface SocialButtonsProps {
  dividerText?: string;
  buttonText?: string;
  onGooglePress?: () => void;
  disabled?: boolean;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({
  dividerText = 'O CONTINÚA CON',
  buttonText = 'Iniciar sesión con Google',
  onGooglePress,
  disabled = false,
}) => {
  return (
    <View className="w-full">
      {/* Divisor de Sección */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-tertiary" />
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="mx-3 text-xs font-bold text-neutral-muted tracking-widest uppercase">
          {dividerText}
        </Text>
        <View className="flex-1 h-[1px] bg-tertiary" />
      </View>

      {/* Botón de Google */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonText}
        className="w-full h-13 bg-inputBg rounded-2xl flex-row items-center justify-center border border-borderBg shadow-sm px-4 py-2"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onGooglePress}
        style={({ pressed }) => [
          { borderCurve: 'continuous', opacity: disabled ? 0.6 : pressed ? 0.8 : 1 },
        ]}
      >
        <View className="mr-3 items-center justify-center">
          <GoogleLogo size={22} />
        </View>
        <Text className="text-neutral font-semibold text-base">
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
};
