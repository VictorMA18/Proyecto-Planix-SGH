import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { NOTIFICATION_CATEGORIES, NOTIFICATION_READ_FILTERS } from '@/constants/notifications';
import { ThemeColors } from '@/constants/theme';
import type { NotificationCategory, NotificationReadFilter } from '@/schemas/notification.schema';

interface NotificationFiltersProps {
  read: NotificationReadFilter;
  readCounts: Record<NotificationReadFilter, number>;
  onReadChange: (read: NotificationReadFilter) => void;
  category: NotificationCategory | null;
  categoryCounts: Record<NotificationCategory, number>;
  onCategoryToggle: (category: NotificationCategory) => void;
}

/**
 * «Todas / No leídas» y chips por categoría. Tocar la categoría elegida la quita. Las clases son
 * fijas y los colores y radios van en el `style` del View interno (NativeWind ignora en nativo el
 * `style` en forma de función del Pressable).
 */
export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  read,
  readCounts,
  onReadChange,
  category,
  categoryCounts,
  onCategoryToggle,
}) => (
  <View className="gap-3">
    <View
      accessibilityRole="tablist"
      style={{ borderCurve: 'continuous', borderRadius: 16 }}
      className="flex-row bg-tertiary p-1"
    >
      {NOTIFICATION_READ_FILTERS.map((option) => {
        const selected = option.value === read;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}, ${readCounts[option.value]}`}
            onPress={() => onReadChange(option.value)}
            className="flex-1 active:opacity-80"
          >
            {/* `key` remonta la opción al cambiar y el fondo nunca es transparente: en Android, una
                vista sin fondo que luego recibe color pierde el redondeado. */}
            <View
              key={selected ? 'on' : 'off'}
              style={{
                borderCurve: 'continuous',
                borderRadius: 12,
                backgroundColor: selected ? ThemeColors.primary : ThemeColors.tertiary,
              }}
              className="min-h-11 flex-row items-center justify-center px-2"
            >
              <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }} className="text-sm font-bold">
                {option.label}
              </Text>
              <View
                style={{ backgroundColor: selected ? 'rgba(255,255,255,0.25)' : ThemeColors.cardBg }}
                className="ml-2 min-w-6 items-center rounded-full px-1.5 py-0.5"
              >
                <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.primary }} className="text-[11px] font-bold">
                  {readCounts[option.value]}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5 flex-grow-0"
      contentContainerClassName="px-5 gap-2"
    >
      {NOTIFICATION_CATEGORIES.map((option) => {
        const selected = option.value === category;
        const count = categoryCounts[option.value];
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}, ${count}${selected ? '. Toca para ver todas las categorías' : ''}`}
            onPress={() => onCategoryToggle(option.value)}
            className="active:opacity-75"
          >
            <View
              style={{
                borderCurve: 'continuous',
                backgroundColor: selected ? ThemeColors.primary : ThemeColors.cardBg,
                borderColor: selected ? ThemeColors.primary : ThemeColors.border,
                borderRadius: 999,
              }}
              className="min-h-11 flex-row items-center border px-3"
            >
              <Ionicons name={option.icon} size={16} color={selected ? '#FFFFFF' : ThemeColors.neutral} />
              <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }} className="ml-1.5 text-sm font-bold">
                {option.label}
              </Text>
              <View
                style={{ backgroundColor: selected ? 'rgba(255,255,255,0.25)' : ThemeColors.tertiary }}
                className="ml-2 min-w-5 items-center rounded-full px-1.5 py-0.5"
              >
                <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }} className="text-[11px] font-bold">
                  {count}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);
