import { useSignIn, useOAuth, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import {
  AppLogoHeader,
  AppInput,
  AppButton,
  SocialButtons,
} from '../../components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = fetchStatus === 'fetching';

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setErrorMessage('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'app' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error al autenticar con Google.');
    }
  }, [startOAuthFlow]);

  const handleSignIn = async () => {
    setErrorMessage('');
    if (!emailAddress || !password) {
      setErrorMessage('Por favor ingresa tu correo corporativo y contraseña.');
      return;
    }

    try {
      const { error } = await signIn.password({ emailAddress, password });

      if (error) {
        setErrorMessage(error.message || 'Error al iniciar sesión. Revisa tus credenciales.');
        return;
      }

      if (signIn.status === 'complete') {
        if (signIn.createdSessionId && setActive) {
          await setActive({ session: signIn.createdSessionId });
        }
      } else if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_first_factor') {
        try {
          if (signIn.mfa?.sendEmailCode) {
            await signIn.mfa.sendEmailCode();
          }
        } catch (_codeErr) {}

        router.push({
          pathname: '/(auth)/verify',
          params: { flow: 'sign-in', identifier: emailAddress },
        });
      } else {
        setErrorMessage('Se requiere acción adicional para iniciar sesión.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || err?.message || 'Ocurrió un error inesperado al iniciar sesión.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-screenBg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 16, 28),
            paddingBottom: Math.max(insets.bottom + 120, 160),
          }}
          contentContainerClassName="px-5 items-center max-w-[460px] w-full self-center"
          className="w-full flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Logo Emblem PLANYX */}
          <AppLogoHeader
            title="Bienvenido de vuelta"
            subtitle="Ingresa tus credenciales para acceder a tus turnos y tareas."
            showBadge
          />

          {/* Card Principal de Autenticación */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="w-full bg-cardBg rounded-3xl p-6 shadow-xl shadow-primary/10 border border-tertiary/60"
          >
            {errorMessage ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4"
              >
                <Text className="text-red-800 text-sm font-sans font-medium">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Campo Correo Corporativo */}
            <AppInput
              label="Correo corporativo"
              requiredText="Obligatorio"
              leftIcon="mail-outline"
              placeholder="ejemplo@acmecorp.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Campo Contraseña */}
            <AppInput
              label="Contraseña"
              requiredText="Obligatorio"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            {/* Opciones Adicionales */}
            <View className="flex-row justify-between items-center mb-6 mt-1">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                accessibilityLabel="Recordar sesión"
                className="flex-row items-center p-1"
                onPress={() => setRememberMe(!rememberMe)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View
                  className={`w-5 h-5 rounded-md border border-neutral-muted mr-2.5 justify-center items-center ${
                    rememberMe ? 'bg-primary border-primary' : ''
                  }`}
                >
                  {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <Text className="text-sm font-medium text-neutral font-sans">
                  Recordar sesión
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="¿Olvidaste tu contraseña?"
                onPress={() => {}}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="p-1"
              >
                <Text className="text-sm font-semibold text-primary font-sans">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </View>

            {/* Botón Principal Iniciar Sesión */}
            <AppButton
              title="Iniciar sesión"
              onPress={handleSignIn}
              isLoading={isSubmitting}
              rightArrow
            />

            {/* Botón Exclusivo Google */}
            <SocialButtons
              dividerText="O CONTINÚA CON"
              buttonText="Iniciar sesión con Google"
              onGooglePress={handleGoogleSignIn}
            />
          </View>

          {/* Footer Registro */}
          <View className="flex-row mt-7 items-center justify-center">
            <Text className="text-base text-neutral-muted font-sans">
              ¿No tienes cuenta?{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a registro de cuenta"
              onPress={() => router.push('/(auth)/sign-up')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-base font-bold text-primary font-sans">
                Regístrate →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
