import { useAuth, useUser, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '../../constants/theme';

export default function HomeScreen() {
  const { signOut } = useClerk();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Sincronización automática de perfil con Clerk User si firstName o lastName no estaban guardados en el objeto User principal
  React.useEffect(() => {
    if (!isUserLoaded || !user) return;

    const metaFirstName = user.unsafeMetadata?.firstName as string | undefined;
    const metaLastName = user.unsafeMetadata?.lastName as string | undefined;

    const missingFirstName = !user.firstName && !!metaFirstName;
    const missingLastName = !user.lastName && !!metaLastName;

    if (missingFirstName || missingLastName) {
      user
        .update({
          firstName: user.firstName || metaFirstName,
          lastName: user.lastName || metaLastName,
        })
        .catch(() => {});
    }
  }, [isUserLoaded, user]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayFirstName =
    user?.firstName ||
    (user?.unsafeMetadata?.firstName as string) ||
    'Usuario';

  const displayFullName =
    user?.fullName ||
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    (user?.unsafeMetadata?.firstName
      ? `${user.unsafeMetadata.firstName} ${(user.unsafeMetadata?.lastName as string) || ''}`.trim()
      : null) ||
    'Usuario Registrado';

  return (
    <SafeAreaView className="flex-1 bg-screenBg">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 40),
          paddingTop: Math.max(insets.top + 16, 24),
        }}
        contentContainerClassName="px-5 items-center max-w-[480px] w-full self-center"
        className="w-full flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con el Logo Oficial PLANYX */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-3xl bg-cardBg justify-center items-center mb-3 shadow-md shadow-primary/15 border border-purple-500/15">
            <Image
              source={require('../../../assets/images/Logo_Planix.png')}
              className="w-14 h-14"
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-extrabold text-primary tracking-widest">
            PLANYX
          </Text>
          <Text className="text-xs text-neutral-muted mt-1 font-sans">
            Sistema de Gestión Horaria & Asistencia
          </Text>
        </View>

        {/* Card Principal de Perfil Autenticado */}
        <View className="w-full bg-cardBg rounded-3xl p-6 shadow-md shadow-primary/10 border border-tertiary/60">
          <View className="flex-row items-center self-start bg-tertiary px-3 py-1.5 rounded-full mb-4">
            <View className="w-2 h-2 rounded-full bg-primary mr-2" />
            <Text className="text-xs font-semibold text-primary font-sans">
              Sesión Activa — Clerk Auth
            </Text>
          </View>

          <Text className="text-2xl font-bold text-neutral mb-1 font-sans">
            ¡Hola, {displayFirstName}!
          </Text>
          <Text className="text-sm text-neutral-muted mb-5 font-sans">
            Bienvenido al panel principal de PLANYX.
          </Text>

          <View className="bg-inputBg rounded-2xl p-4 border border-borderBg mb-5">
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-xs text-neutral-muted font-sans">
                Nombre:
              </Text>
              <Text className="text-xs font-semibold text-neutral font-sans">
                {displayFullName}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2.5">
              <Text className="text-xs text-neutral-muted font-sans">
                Correo corporativo:
              </Text>
              <Text className="text-xs font-semibold text-neutral font-sans">
                {user?.primaryEmailAddress?.emailAddress || 'correo@acmecorp.com'}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-neutral-muted font-sans">
                Clerk ID:
              </Text>
              <Text className="text-xs font-semibold text-neutral font-mono">
                {user?.id || 'user_id'}
              </Text>
            </View>
          </View>

          <View className="bg-tertiary rounded-2xl p-4 mb-6">
            <Text className="text-sm font-bold text-secondary mb-1.5 font-sans">
              Fase 1 — Núcleo Completada
            </Text>
            <Text className="text-xs text-neutral leading-5 font-sans">
              ✔ Interfaces migradas a NativeWind con tipografía DM Sans.{'\n'}
              ✔ Color primario corporativo #6B46C1 y Google Auth SVG.{'\n'}
              ✔ Insets dinámicos para Android Nav Bar e inicio de sesión seguro.
            </Text>
          </View>

          <TouchableOpacity
            className={`w-full h-12 bg-neutral rounded-2xl justify-center items-center ${
              isSigningOut ? 'opacity-60' : 'active:opacity-85'
            }`}
            onPress={handleSignOut}
            disabled={isSigningOut}
            activeOpacity={0.85}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-bold font-sans">
                Cerrar Sesión
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
