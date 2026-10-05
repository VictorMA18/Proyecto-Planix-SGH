import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F6F4FF' },
      }}
    >
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="verify" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
