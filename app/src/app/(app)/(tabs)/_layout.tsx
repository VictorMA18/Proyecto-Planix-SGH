import { Tabs } from 'expo-router';
import React from 'react';

import { FloatingTabBar, OrgTabHeader } from '@/components/navigation';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <OrgTabHeader />,
        sceneStyle: { backgroundColor: '#F6F4FF' },
      }}
    >
      {/* El orden de estas pantallas es el de la barra inferior. */}
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="asistencia" />
      <Tabs.Screen name="tareas" />
      <Tabs.Screen name="metricas" />
      <Tabs.Screen name="equipo" />
    </Tabs>
  );
}
