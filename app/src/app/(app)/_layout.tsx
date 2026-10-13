import { Stack } from 'expo-router';

import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function AppLayout() {
  // Push del dispositivo o navegador: registro, avisos en primer plano y apertura al tocarlos.
  usePushNotifications();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F6F4FF' },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="miembro/[miembroId]" />
      <Stack.Screen name="tarea/nueva" />
      <Stack.Screen name="tarea/[tareaId]/index" />
      <Stack.Screen name="tarea/[tareaId]/editar" />
      <Stack.Screen name="notificaciones" />
      <Stack.Screen name="historial" />
      <Stack.Screen name="mi-turno" />
      <Stack.Screen name="reportes" />
      <Stack.Screen name="turnos/index" />
      <Stack.Screen name="turnos/nuevo" />
      <Stack.Screen name="turnos/[turnoId]/index" />
      <Stack.Screen name="turnos/[turnoId]/editar" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="create-organization" />
      <Stack.Screen name="join-organization" />
    </Stack>
  );
}
