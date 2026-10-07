import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Dos o tres segmentos exclusivos (p. ej. «Personal» / «Código genérico»). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={{ borderCurve: 'continuous' }}
      className="flex-row bg-tertiary rounded-2xl p-1 mb-5"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 }]}
            className={`flex-1 min-h-11 items-center justify-center rounded-xl px-2 ${
              selected ? 'bg-white' : ''
            }`}
          >
            <Text className={`text-sm ${selected ? 'font-bold text-primary' : 'font-medium text-neutral-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
