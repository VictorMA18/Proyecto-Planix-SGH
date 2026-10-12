import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { toDateKey } from '@/utils/tasks';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

interface MonthPickerSheetProps {
  visible: boolean;
  /** Mes elegido (`YYYY-MM`). */
  value: string;
  onChange: (month: string) => void;
  onClose: () => void;
}

/** Elegir mes y año de un toque: año con flechas y los 12 meses en cuadrícula. */
export const MonthPickerSheet: React.FC<MonthPickerSheetProps> = ({ visible, value, onChange, onClose }) => {
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const current = toDateKey(new Date()).slice(0, 7);

  // Al abrir, el año visible es el del mes elegido.
  useEffect(() => {
    if (visible) setYear(Number(value.slice(0, 4)));
  }, [visible, value]);

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      header={
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Año anterior, ${year - 1}`}
            onPress={() => setYear((y) => y - 1)}
            className="w-11 h-11 rounded-full items-center justify-center active:bg-tertiary"
          >
            <Ionicons name="chevron-back" size={20} color={ThemeColors.neutral} />
          </Pressable>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="text-xl font-extrabold text-neutral">
            {year}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Año siguiente, ${year + 1}`}
            onPress={() => setYear((y) => y + 1)}
            className="w-11 h-11 rounded-full items-center justify-center active:bg-tertiary"
          >
            <Ionicons name="chevron-forward" size={20} color={ThemeColors.neutral} />
          </Pressable>
        </View>
      }
    >
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap">
        {MONTHS.map((label, index) => {
          const key = `${year}-${String(index + 1).padStart(2, '0')}`;
          const selected = key === value;
          const isCurrent = key === current;
          return (
            <View key={key} className="w-1/3 p-1">
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${MONTH_NAMES[index]} de ${year}${isCurrent ? ', mes actual' : ''}`}
                onPress={() => {
                  onChange(key);
                  onClose();
                }}
                className="active:opacity-75"
              >
                {/* Clases fijas; lo que cambia según el estado va en `style`. */}
                <View
                  style={{
                    borderCurve: 'continuous',
                    backgroundColor: selected ? ThemeColors.primary : ThemeColors.inputBg,
                    borderColor: isCurrent && !selected ? ThemeColors.primary : ThemeColors.border,
                  }}
                  className="min-h-12 items-center justify-center rounded-2xl border"
                >
                  <Text
                    style={{ color: selected ? '#FFFFFF' : isCurrent ? ThemeColors.primary : ThemeColors.neutral }}
                    className="text-sm font-bold"
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ir al mes actual"
        onPress={() => {
          onChange(current);
          onClose();
        }}
        className="min-h-11 flex-row items-center justify-center mt-2 active:opacity-70"
      >
        <Ionicons name="calendar-outline" size={16} color={ThemeColors.primary} />
        <Text className="ml-1.5 text-sm font-bold text-primary">Ir al mes actual</Text>
      </Pressable>
    </ActionSheet>
  );
};
