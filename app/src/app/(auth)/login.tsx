import { useSignIn, useClerk } from '@clerk/expo';
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
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import {
  AppLogoHeader,
  AppInput,
  AppButton,
  SocialButtons,
} from '../../components/ui';
import { loginSchema } from '../../schemas/auth.schema';
import { useGoogleSignIn } from '../../hooks/use-google-sign-in';
import { useSignInCode } from '../../hooks/use-sign-in-code';
import { useAuthStore } from '../../stores/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const google = useGoogleSignIn();
  const { sendCode, supportsEmailCode } = useSignInCode();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { rememberedEmail, rememberMe: storedRememberMe, hasHydrated, setRememberedEmail } =
    useAuthStore();

  const [emailAddress, setEmailAddress] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(storedRememberMe);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ emailAddress?: string; password?: string }>({});

  const isSubmitting = fetchStatus === 'fetching';

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  // El store persistido se hidrata de forma asíncrona: aplicar el correo recordado al terminar.
  useEffect(() => {
    if (!hasHydrated) return;
    setEmailAddress((current) => current || rememberedEmail);
    setRememberMe(storedRememberMe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  const handleEmailChange = (text: string) => {
    setEmailAddress(text);
    if (fieldErrors.emailAddress) {
      setFieldErrors((prev) => ({ ...prev, emailAddress: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleSignIn = async () => {
    setErrorMessage('');
    setFieldErrors({});

    // Validar entradas con Zod schema
    const validationResult = loginSchema.safeParse({
      emailAddress,
      password,
    });

    if (!validationResult.success) {
      const errors: { emailAddress?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as 'emailAddress' | 'password';
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    const { emailAddress: validEmail, password: validPassword } = validationResult.data;

    try {
      const { error } = await signIn.password({
        emailAddress: validEmail,
        password: validPassword,
      });

      if (error) {
        setErrorMessage(error.message || 'Error al iniciar sesión. Revisa tus credenciales.');
        return;
      }

      // Guardar preferencia de email en Zustand
      setRememberedEmail(validEmail, rememberMe);

      if (signIn.status === 'complete') {
        if (signIn.createdSessionId && setActive) {
          await setActive({ session: signIn.createdSessionId });
        }
      } else if (
        signIn.status === 'needs_client_trust' ||
        signIn.status === 'needs_second_factor' ||
        signIn.status === 'needs_first_factor'
      ) {
        // Dispositivo nuevo (client trust), verificación en dos pasos o primer factor: código por correo.
        if (!supportsEmailCode()) {
          setErrorMessage(
            'Tu cuenta usa otro método de verificación en dos pasos (app autenticadora o SMS), que la app todavía no admite.'
          );
          return;
        }

        const sendError = await sendCode(validEmail);
        if (sendError) {
          setErrorMessage(sendError);
          return;
        }

        router.push({
          pathname: '/(auth)/verify',
          params: { flow: 'sign-in', identifier: validEmail },
        });
      } else if (signIn.status === 'needs_new_password') {
        setErrorMessage(
          'Debes establecer una contraseña nueva para tu cuenta. La recuperación de contraseña aún no está disponible en la app.'
        );
      } else {
        // Estado que la app no maneja: se muestra cuál es para poder diagnosticarlo.
        console.warn(`[login] Estado de inicio de sesión no manejado: ${signIn.status}`);
        setErrorMessage(`Se requiere una acción adicional para iniciar sesión (estado: ${signIn.status}).`);
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

            {/* Campo Correo Corporativo */}
            <AppInput
              label="Correo corporativo"
              requiredText="Obligatorio"
              leftIcon="mail-outline"
              placeholder="ejemplo@acmecorp.com"
              value={emailAddress}
              onChangeText={handleEmailChange}
              error={fieldErrors.emailAddress}
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
              onChangeText={handlePasswordChange}
              error={fieldErrors.password}
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
              onGooglePress={google.signInWithGoogle}
              disabled={google.isLoading}
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
