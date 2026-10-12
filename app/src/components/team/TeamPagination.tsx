import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { TEAM_PAGINATION_WINDOW } from '@/constants/team';

interface TeamPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

/** «Mostrando 1 - 4 de 48» + botones de página (ventana deslizante). */
export const TeamPagination: React.FC<TeamPaginationProps> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const windowSize = Math.min(TEAM_PAGINATION_WINDOW, totalPages);
  const start = Math.min(Math.max(1, page - Math.floor(windowSize / 2)), totalPages - windowSize + 1);
  const pages = Array.from({ length: windowSize }, (_, i) => start + i);

  const arrow = (direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? page - 1 : page + 1;
    const disabled = target < 1 || target > totalPages;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={direction === 'prev' ? 'Página anterior' : 'Página siguiente'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(target)}
        style={({ pressed }) => [{ opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}
        className="w-11 h-11 items-center justify-center"
      >
        <Ionicons
          name={direction === 'prev' ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={ThemeColors.neutral}
        />
      </Pressable>
    );
  };

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2">
      <Text className="text-xs text-neutral-muted">
        Mostrando <Text className="font-bold text-neutral">{from} - {to}</Text> de {total}
      </Text>

      <View className="flex-row items-center">
        {arrow('prev')}
        {pages.map((p) => {
          const selected = p === page;
          return (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={`Página ${p}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(p)}
              className="active:opacity-75"
            >
              {/* Fondo y radio en el `style` de un View interno (NativeWind ignora en nativo el
                  `style` en forma de función) y `key` para remontar al cambiar de página. */}
              <View
                key={selected ? 'on' : 'off'}
                style={{
                  borderCurve: 'continuous',
                  borderRadius: 12,
                  backgroundColor: selected ? ThemeColors.primary : ThemeColors.screenBg,
                }}
                className="w-11 h-11 items-center justify-center"
              >
                <Text style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }} className="text-sm font-bold">
                  {p}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {arrow('next')}
      </View>
    </View>
  );
};
