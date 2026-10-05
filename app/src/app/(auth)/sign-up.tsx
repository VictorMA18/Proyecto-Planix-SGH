import { useSignUp, useOAuth } from '@clerk/expo';
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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import {
  AppLogoHeader,
  AppInput,
  AppButton,
  SocialButtons,
} from '../../components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = fetchStatus === 'fetching';

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignUp = useCallback(async () => {
    setErrorMessage('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'app' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error al registrarse con Google.');
    }
  }, [startOAuthFlow]);

  const handleSignUp = async () => {
    setErrorMessage('');
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = emailAddress.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password) {
      setErrorMessage('Por favor completa todos los campos requeridos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      // 1. Crear el objeto SignUp oficial en Clerk con firstName, lastName y unsafeMetadata
      const createRes = await signUp.create({
        emailAddress: trimmedEmail,
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        unsafeMetadata: {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        },
      });

      if (createRes?.error) {
        setErrorMessage(
          createRes.error.message || 'Ocurrió un error al crear la cuenta en Clerk.'
        );
        return;
      }

      // 2. Enviar el código de verificación por correo usando verifications.sendEmailCode
      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes?.error) {
        setErrorMessage(
          sendRes.error.message || 'No se pudo enviar el código de verificación.'
        );
        return;
      }

      // 3. Navegar a la pantalla de verificación OTP
      router.push({
        pathname: '/(auth)/verify',
        params: {
          flow: 'sign-up',
          identifier: trimmedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        },
      });
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || err?.message || 'Ocurrió un error inesperado al registrar la cuenta.'
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
          {/* Header Logo Emblem */}
          <AppLogoHeader
            title="Crea tu cuenta"
            subtitle="Gestiona tus jornadas, tareas y equipo en un solo lugar."
          />

          {/* Card Principal de Registro */}
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

            {/* Campo Nombres */}
            <AppInput
              label="Nombres"
              requiredText="Requerido"
              leftIcon="person-outline"
              placeholder="Ej. Carlos"
              value={firstName}
              onChangeText={setFirstName}
            />

            {/* Campo Apellidos */}
            <AppInput
              label="Apellidos"
              requiredText="Requerido"
              leftIcon="person-outline"
              placeholder="Ej. Méndez"
              value={lastName}
              onChangeText={setLastName}
            />

            {/* Campo Correo Corporativo */}
            <AppInput
              label="Correo corporativo o personal"
              requiredText="Acceso único"
              leftIcon="mail-outline"
              placeholder="tu@empresa.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Campo Contraseña */}
            <AppInput
              label="Contraseña"
              requiredText="Mínimo 15 caracteres"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              placeholder="Crea una contraseña segura"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            {/* Campo Confirmar Contraseña con Verificador en el Label */}
            <AppInput
              label="Confirmar contraseña"
              statusBadge={
                confirmPassword.length > 0
                  ? password === confirmPassword
                    ? { text: 'Coinciden', type: 'success' }
                    : { text: 'No coinciden', type: 'error' }
                  : undefined
              }
              leftIcon="sync-outline"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />

            {/* Botón Principal Registrar Cuenta */}
            <AppButton
              title="Crear cuenta"
              onPress={handleSignUp}
              isLoading={isSubmitting}
              rightArrow
            />

            {/* Botón Exclusivo Google */}
            <SocialButtons
              dividerText="O REGÍSTRATE CON"
              buttonText="Regístrate con Google"
              onGooglePress={handleGoogleSignUp}
            />
          </View>

          {/* Footer Login */}
          <View className="flex-row mt-7 items-center justify-center">
            <Text className="text-base text-neutral-muted font-sans">
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir a iniciar sesión"
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-base font-bold text-primary font-sans">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
