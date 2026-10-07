import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ThemeStatus } from '@/constants/theme';

interface UserAvatarProps {
  initials: string;
  uri?: string;
  size?: number;
  showStatusDot?: boolean;
  /** Color del punto de estado (por defecto, verde). */
  statusColor?: string;
  /** Si se define, muestra el botón de cámara sobre el avatar. */
  onCameraPress?: () => void;
  /** Muestra un indicador de carga sobre la imagen (p. ej. mientras se sube). */
  isBusy?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  initials,
  uri,
  size = 44,
  showStatusDot = false,
  statusColor = ThemeStatus.success,
  onCameraPress,
  isBusy = false,
}) => {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-tertiary border-2 border-white items-center justify-center overflow-hidden"
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={{ fontSize: size * 0.34 }} className="font-bold text-primary">
            {initials}
          </Text>
        )}
        {isBusy ? (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {showStatusDot ? (
        <View
          style={{ backgroundColor: statusColor }}
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
        />
      ) : null}

      {onCameraPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          accessibilityState={{ disabled: isBusy, busy: isBusy }}
          disabled={isBusy}
          onPress={onCameraPress}
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-2 border-white items-center justify-center"
        >
          <Ionicons name="camera-outline" size={15} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
};
