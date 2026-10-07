import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface TeamSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const TeamSearchBar: React.FC<TeamSearchBarProps> = ({ value, onChangeText }) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="flex-row items-center bg-cardBg border border-borderBg rounded-2xl pl-4 min-h-12"
  >
    <Ionicons name="search-outline" size={20} color={ThemeColors.mutedText} />
    <TextInput
      accessibilityLabel="Buscar en el equipo"
      style={{ fontFamily: 'DMSans_400Regular' }}
      className="flex-1 ml-3 py-3 text-sm text-neutral"
      placeholder="Buscar por nombre o correo"
      placeholderTextColor={ThemeColors.mutedText}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
    {value ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Borrar búsqueda"
        onPress={() => onChangeText('')}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        className="w-11 h-11 items-center justify-center"
      >
        <Ionicons name="close-circle" size={18} color={ThemeColors.mutedText} />
      </Pressable>
    ) : (
      <View className="w-4" />
    )}
  </View>
);
