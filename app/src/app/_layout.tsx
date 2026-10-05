import "../global.css";
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'react-native-css-interop';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';

cssInterop(SafeAreaView, { className: 'style' });

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!publishableKey) {
  console.warn('Advertencia: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no está definida en .env');
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('#F6F4FF').catch(() => {});
      const nav: any = NavigationBar;
      if (typeof nav.setPositionAsync === 'function') nav.setPositionAsync('absolute').catch(() => {});
      if (typeof nav.setBackgroundColorAsync === 'function') nav.setBackgroundColorAsync('#00000000').catch(() => {});
      if (typeof nav.setStyleAsync === 'function') nav.setStyleAsync('dark').catch(() => {});
      if (typeof nav.setButtonStyleAsync === 'function') nav.setButtonStyleAsync('dark').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (isSignedIn && !inAppGroup) {
      router.replace('/(app)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-screenBg">
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text className="text-neutral-muted mt-3 text-base font-sans">
          Inicializando PLANYX...
        </Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    'DM Sans': DMSans_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-screenBg">
        <ActivityIndicator size="large" color="#6B46C1" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <InitialLayout />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
