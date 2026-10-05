import { useSignIn, useSignUp, useClerk } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  OtpDigitInputs,
  AppButton,
} from '../../components/ui';

export default function VerifyCodeScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    flow?: string;
    identifier?: string;
    firstName?: string;
    lastName?: string;
  }>();

  const flow = params.flow || 'sign-in';
  const identifier = params.identifier || 'carlos.mendez@acmecorp.com';
  const firstNameParam = params.firstName || '';
  const lastNameParam = params.lastName || '';

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length === 0) {
      setErrorMessage('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    setIsLoading(true);

    try {
      if (flow === 'sign-up') {
        const verifyRes = await signUp.verifications.verifyEmailCode({ code: cleanCode });

        if (verifyRes?.error) {
          setErrorMessage(verifyRes.error.message || 'Código de verificación incorrecto.');
          setIsLoading(false);
          return;
        }

        if (signUp.status === 'complete') {
          setSuccessMessage('¡Código verificado con éxito!');
          if (signUp.createdSessionId && setActive) {
            await setActive({ session: signUp.createdSessionId });
          }
        } else {
          setErrorMessage('El código de verificación es incorrecto o faltan requisitos.');
        }
      } else {
        if (signIn.emailCode?.verifyCode) {
          await signIn.emailCode.verifyCode({ code: cleanCode });
        } else if (signIn.mfa?.verifyEmailCode) {
          await signIn.mfa.verifyEmailCode({ code: cleanCode });
        }

        if (signIn.status === 'complete') {
          setSuccessMessage('¡Código verificado! Accediendo...');
          if (signIn.createdSessionId && setActive) {
            await setActive({ session: signIn.createdSessionId });
          }
        } else {
          setErrorMessage('El código de verificación es incorrecto o expiró.');
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || err?.message || 'Error al validar el código de verificación.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (flow === 'sign-up') {
        await signUp.verifications.sendEmailCode();
      } else {
        if (signIn.mfa?.sendEmailCode) {
          await signIn.mfa.sendEmailCode();
        } else if (signIn.emailCode?.sendCode) {
          await signIn.emailCode.sendCode({ emailAddress: identifier });
        }
      }
      setSuccessMessage('Un nuevo código de verificación ha sido enviado a tu correo.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo reenviar el código.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-screenBg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 20, 36),
            paddingBottom: Math.max(insets.bottom + 80, 100),
          }}
          contentContainerClassName="px-5 items-center max-w-[460px] w-full self-center"
          className="w-full flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Emblem Identity con fondo morado más amplio */}
          <View className="my-6 items-center">
            <View
              style={{ borderCurve: 'continuous' }}
              className="w-24 h-24 rounded-3xl bg-tertiary justify-center items-center shadow-md border border-purple-200"
            >
              <Ionicons name="mail-unread-outline" size={38} color="#6B46C1" />
            </View>
          </View>

          {/* Card Principal de OTP */}
          <View
            style={{ borderCurve: 'continuous' }}
            className="w-full bg-cardBg rounded-3xl p-6 items-center shadow-xl border border-tertiary"
          >
            <Text
              accessibilityRole="header"
              className="text-3xl font-extrabold text-neutral text-center mb-2 font-sans tracking-tight"
            >
              Código de verificación
            </Text>
            <Text className="text-sm text-neutral-muted text-center leading-5 mb-5 font-sans">
              Hemos enviado un código seguro de 6 dígitos a tu correo registrado:
            </Text>

            {/* Email Badge limpio (sin icono de lápiz) */}
            <View
              style={{ borderCurve: 'continuous' }}
              className="flex-row items-center bg-tertiary px-4 py-2.5 rounded-full mb-5 max-w-full"
            >
              <View className="mr-2">
                <Ionicons name="mail-outline" size={16} color="#5B30D9" />
              </View>
              <Text className="text-sm font-semibold text-secondary font-sans" numberOfLines={1}>
                {identifier}
              </Text>
            </View>

            {errorMessage ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="w-full bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4"
              >
                <Text className="text-red-800 text-sm text-center font-sans font-medium">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="w-full bg-green-100 border border-green-500 rounded-2xl p-3.5 mb-4"
              >
                <Text className="text-green-800 text-sm text-center font-sans font-medium">
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {/* OTP Digit Boxes Component (casillas más anchas y alargadas) */}
            <OtpDigitInputs value={code} onChangeText={setCode} />

            {/* Reenviar código sin contador de tiempo */}
            <View className="flex-row items-center my-4 flex-wrap justify-center">
              <Text className="text-sm text-neutral-muted font-sans">
                ¿No recibiste el correo?{' '}
              </Text>
              <TouchableOpacity
                accessibilityLabel="Reenviar código de verificación"
                onPress={handleResendCode}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-bold text-primary underline font-sans">
                  Reenviar código
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Principal "Verificar código" sin truncado */}
            <AppButton
              title="Verificar código"
              onPress={handleVerify}
              isLoading={isLoading}
              rightArrow
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
