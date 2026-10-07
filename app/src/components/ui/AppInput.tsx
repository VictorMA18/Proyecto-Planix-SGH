import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/theme';

interface AppInputProps extends TextInputProps {
  label: string;
  requiredText?: string;
  statusBadge?: { text: string; type: 'success' | 'error' };
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  requiredText,
  statusBadge,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  ...props
}) => {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1.5">
        <View className="flex-row items-center flex-1 pr-2 flex-wrap">
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xs font-semibold text-neutral mr-2">
            {label}
          </Text>
          {statusBadge ? (
            <View
              className={`flex-row items-center px-2 py-0.5 rounded-full ${
                statusBadge.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Ionicons
                name={statusBadge.type === 'success' ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color={statusBadge.type === 'success' ? '#16A34A' : ThemeColors.error}
                style={{ marginRight: 3 }}
              />
              <Text
                style={{ fontFamily: 'DMSans_700Bold' }}
                className={`text-[11px] font-bold ${
                  statusBadge.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {statusBadge.text}
              </Text>
            </View>
          ) : null}
        </View>
        {requiredText ? (
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-[11px] text-neutral-muted">
            {requiredText}
          </Text>
        ) : null}
      </View>
      <View className="relative justify-center">
        <Ionicons
          name={leftIcon}
          size={19}
          color={error ? ThemeColors.error : ThemeColors.mutedText}
          style={{ position: 'absolute', left: 14, zIndex: 1 }}
        />
        <TextInput
          accessibilityLabel={label}
          style={[{ fontFamily: 'DMSans_400Regular' }, style]}
          className={`h-12 bg-inputBg border rounded-xl pl-11 pr-4 text-sm text-neutral ${
            error ? 'border-red-500 bg-red-50/30' : 'border-borderBg'
          } ${rightIcon ? 'pr-11' : ''}`}
          placeholderTextColor={ThemeColors.mutedText}
          {...props}
        />
        {rightIcon ? (
          <TouchableOpacity
            style={{ position: 'absolute', right: 12, zIndex: 1 }}
            className="p-1.5"
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={20} color={error ? ThemeColors.error : ThemeColors.mutedText} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <View className="flex-row items-center mt-1.5 ml-1">
          <Ionicons name="alert-circle-outline" size={13} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-xs text-red-600">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
