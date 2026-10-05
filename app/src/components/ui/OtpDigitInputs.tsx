import React from 'react';
import { View, TextInput } from 'react-native';

interface OtpDigitInputsProps {
  value: string;
  onChangeText: (code: string) => void;
  length?: number;
}

export const OtpDigitInputs: React.FC<OtpDigitInputsProps> = ({
  value,
  onChangeText,
  length = 6,
}) => {
  return (
    <View className="w-full my-4">
      <TextInput
        value={value}
        onChangeText={(text) => {
          const numericText = text.replace(/[^0-9]/g, '');
          if (numericText.length <= length) {
            onChangeText(numericText);
          }
        }}
        keyboardType="number-pad"
        maxLength={length}
        placeholder="000000"
        placeholderTextColor="#A0AEC0"
        style={{ letterSpacing: 14 }}
        className="w-full h-14 bg-inputBg border border-borderBg rounded-2xl text-center text-2xl font-bold text-neutral pl-3"
        autoFocus
      />
    </View>
  );
};
