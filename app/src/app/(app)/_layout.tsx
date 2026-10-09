import { Stack } from 'expo-router';

export default function AppLayout() {
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
      <Stack.Screen name="historial" />
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
