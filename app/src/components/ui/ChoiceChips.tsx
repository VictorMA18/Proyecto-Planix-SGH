import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  /** Color del texto y borde cuando está seleccionada (por defecto, el primario). */
  accent?: string;
}

interface ChoiceChipsProps<T extends string | number> {
  label: string;
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}

/** Selector de una opción entre pocas (rol, vigencia…), con etiqueta, accesibilidad y error. */
export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
}: ChoiceChipsProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-neutral mb-1.5">{label}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          const accent = option.accent ?? ThemeColors.primary;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              className="rounded-full active:opacity-75"
            >
              {/* Los colores van en una View con `style` estático: NativeWind ignora los de un
                  `style` en forma de función cuando el Pressable también tiene className. */}
              <View
                style={{
                  borderCurve: 'continuous',
                  borderColor: selected ? accent : ThemeColors.border,
                  backgroundColor: selected ? ThemeColors.tertiary : ThemeColors.inputBg,
                }}
                className="min-h-11 items-center justify-center rounded-full border px-4"
              >
                <Text
                  style={selected ? { color: accent } : undefined}
                  className={`text-sm ${selected ? 'font-bold' : 'font-medium text-neutral'}`}
                >
                  {option.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="mt-1.5 ml-1 text-xs font-medium text-red-600">{error}</Text> : null}
    </View>
  );
}
