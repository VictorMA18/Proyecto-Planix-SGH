import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

export type DetailTab = 'DETALLES' | 'COMENTARIOS' | 'ACTIVIDAD';

const TABS: { value: DetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'DETALLES', label: 'Detalles', icon: 'document-text-outline' },
  { value: 'COMENTARIOS', label: 'Comentarios', icon: 'chatbubble-outline' },
  { value: 'ACTIVIDAD', label: 'Actividad', icon: 'time-outline' },
];

interface DetailTabsProps {
  value: DetailTab;
  comments: number;
  onChange: (tab: DetailTab) => void;
}

/** Pestañas del detalle con subrayado en la activa. */
export const DetailTabs: React.FC<DetailTabsProps> = ({ value, comments, onChange }) => (
  <View accessibilityRole="tablist" className="flex-row border-b border-borderBg">
    {TABS.map((tab) => {
      const selected = tab.value === value;
      return (
        <Pressable
          key={tab.value}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={tab.value === 'COMENTARIOS' ? `${tab.label}, ${comments}` : tab.label}
          onPress={() => onChange(tab.value)}
          className="flex-1 min-h-11 items-center justify-center active:opacity-70"
        >
          <View className="flex-row items-center pb-2">
            <Ionicons name={tab.icon} size={15} color={selected ? ThemeColors.primary : ThemeColors.mutedText} />
            <Text className={`ml-1.5 text-sm ${selected ? 'font-extrabold text-primary' : 'font-semibold text-neutral-muted'}`}>
              {tab.label}
            </Text>
            {tab.value === 'COMENTARIOS' && comments > 0 ? (
              <View className="ml-1.5 bg-tertiary rounded-full px-1.5">
                <Text className="text-[11px] font-bold text-primary">{comments}</Text>
              </View>
            ) : null}
          </View>
          <View className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${selected ? 'bg-primary' : ''}`} />
        </Pressable>
      );
    })}
  </View>
);
