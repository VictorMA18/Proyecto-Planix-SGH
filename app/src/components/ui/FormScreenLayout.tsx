import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from './ScreenHeader';

interface FormScreenLayoutProps {
  title: string;
  children: React.ReactNode;
}

/** Pantalla de formulario: cabecera con volver, teclado y tarjeta central como en el login. */
export const FormScreenLayout: React.FC<FormScreenLayoutProps> = ({ title, children }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title={title} onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          className="flex-1"
          contentContainerClassName="w-full max-w-[480px] self-center px-5"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{ borderCurve: 'continuous' }}
            className="w-full bg-cardBg rounded-3xl p-6 shadow-xl shadow-primary/10 border border-tertiary/60"
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
