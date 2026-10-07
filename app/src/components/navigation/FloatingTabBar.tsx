import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_ITEMS } from '@/constants/navigation';
import { ThemeColors } from '@/constants/theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Barra de pestañas flotante (Inicio, Asistencia, Tareas, Métricas, Equipo). */
export const FloatingTabBar: React.FC<TabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      className="w-full max-w-[480px] self-center bg-screenBg px-5 pt-2"
    >
      <View
        accessibilityRole="tablist"
        style={{ borderCurve: 'continuous' }}
        className="flex-row bg-cardBg rounded-3xl p-1 shadow-lg shadow-primary/15 border border-borderBg"
      >
        {state.routes.map((route, index) => {
          const item = TAB_ITEMS.find((tab) => tab.name === route.name);
          if (!item) return null;

          const focused = state.index === index;
          const color = focused ? ThemeColors.primary : ThemeColors.mutedText;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
              className={`flex-1 min-h-14 items-center justify-center rounded-2xl ${
                focused ? 'bg-tertiary' : ''
              }`}
            >
              <Ionicons name={focused ? item.iconActive : item.icon} size={20} color={color} />
              <Text style={{ color }} className={`mt-0.5 text-[10px] ${focused ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
