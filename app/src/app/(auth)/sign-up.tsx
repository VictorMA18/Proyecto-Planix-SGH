import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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

import {
  AppLogoHeader,
  AppInput,
  AppButton,
  SocialButtons,
} from '../../components/ui';
import { signUpSchema, SignUpInput, PASSWORD_MIN_LENGTH } from '../../schemas/auth.schema';
import { useGoogleSignIn } from '../../hooks/use-google-sign-in';
import { useAuthStore } from '../../stores/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

type FieldErrors = Partial<Record<keyof SignUpInput, string>>;

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const google = useGoogleSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPendingVerification } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isSubmitting = fetchStatus === 'fetching';

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const clearFieldError = (field: keyof SignUpInput) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignUp = async () => {
    setErrorMessage('');
    setFieldErrors({});

    // Validar entradas con Zod schema
    const validationResult = signUpSchema.safeParse({
      firstName,
      lastName,
      emailAddress,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: FieldErrors = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof SignUpInput;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    const {
      firstName: validFirstName,
      lastName: validLastName,
      emailAddress: validEmail,
      password: validPassword,
    } = validationResult.data;

    try {
      // 1. Crear la cuenta en Clerk con datos validados
      const createRes = await signUp.create({
        emailAddress: validEmail,
        password: validPassword,
        firstName: validFirstName,
        lastName: validLastName,
        unsafeMetadata: {
          firstName: validFirstName,
          lastName: validLastName,
        },
      });

      if (createRes?.error) {
        setErrorMessage(
          createRes.error.message || 'Ocurrió un error al crear la cuenta en Clerk.'
        );
        return;
      }

      // 2. Enviar el código de verificación por correo
      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes?.error) {
        setErrorMessage(
          sendRes.error.message || 'No se pudo enviar el código de verificación.'
        );
        return;
      }

      // 3. Guardar estado de verificación pendiente en Zustand
      setPendingVerification({
        identifier: validEmail,
        flow: 'sign-up',
        firstName: validFirstName,
        lastName: validLastName,
      });

      // 4. Navegar a la pantalla de verificación OTP
      router.push({
        pathname: '/(auth)/verify',
        params: {
          flow: 'sign-up',
          identifier: validEmail,
          firstName: validFirstName,
          lastName: validLastName,
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
            {errorMessage || google.error ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4"
              >
                <Text className="text-red-800 text-sm font-sans font-medium">
                  {errorMessage || google.error}
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
              onChangeText={(text) => {
                setFirstName(text);
                clearFieldError('firstName');
              }}
              error={fieldErrors.firstName}
            />

            {/* Campo Apellidos */}
            <AppInput
              label="Apellidos"
              requiredText="Requerido"
              leftIcon="person-outline"
              placeholder="Ej. Méndez"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                clearFieldError('lastName');
              }}
              error={fieldErrors.lastName}
            />

            {/* Campo Correo Corporativo */}
            <AppInput
              label="Correo corporativo o personal"
              requiredText="Acceso único"
              leftIcon="mail-outline"
              placeholder="tu@empresa.com"
              value={emailAddress}
              onChangeText={(text) => {
                setEmailAddress(text);
                clearFieldError('emailAddress');
              }}
              error={fieldErrors.emailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Campo Contraseña */}
            <AppInput
              label="Contraseña"
              requiredText={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              placeholder="Crea una contraseña segura"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              error={fieldErrors.password}
              secureTextEntry={!showPassword}
            />

            {/* Campo Confirmar Contraseña con Verificador en el Label */}
            <AppInput
              label="Confirmar contraseña"
              statusBadge={
                confirmPassword.length > 0 && !fieldErrors.confirmPassword
                  ? password === confirmPassword
                    ? { text: 'Coinciden', type: 'success' }
                    : { text: 'No coinciden', type: 'error' }
                  : undefined
              }
              leftIcon="sync-outline"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              error={fieldErrors.confirmPassword}
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
              onGooglePress={google.signInWithGoogle}
              disabled={google.isLoading}
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
