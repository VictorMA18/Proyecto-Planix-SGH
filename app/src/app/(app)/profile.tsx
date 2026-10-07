import { useClerk } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState, OrganizationAccountCard } from '@/components/organizations';
import { AppButton, GoogleLogo, ScreenHeader, UserAvatar } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { useProfileImage } from '@/hooks/use-profile-image';
import { DEFAULT_TAB_HREF } from '@/constants/navigation';
import { useActiveMembership } from '@/hooks/use-active-membership';
import { useMemberships } from '@/services/organizations';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const user = useUserDisplay();
  const profileImage = useProfileImage();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const queryClient = useQueryClient();
  const membershipsQuery = useMemberships();
  const memberships = membershipsQuery.data;
  const { activeOrganizationId, setActiveOrganization } = useActiveMembership(memberships);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      // Evita que los datos de esta cuenta queden en caché para la siguiente sesión.
      queryClient.clear();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Mi Cuenta PLANYX" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ borderCurve: 'continuous' }}
          className="bg-cardBg rounded-3xl p-5 items-center shadow-sm shadow-primary/10"
        >
          <UserAvatar
            initials={user.initials}
            uri={user.imageUrl}
            size={96}
            onCameraPress={profileImage.pickAndUpload}
            isBusy={profileImage.isUploading}
          />
          {user.imageUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar foto de perfil"
              disabled={profileImage.isUploading}
              onPress={profileImage.removeImage}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="min-h-11 items-center justify-center px-3"
            >
              <Text className="text-xs font-semibold text-neutral-muted">Quitar foto</Text>
            </Pressable>
          ) : null}
          {profileImage.error ? (
            <Text accessibilityRole="alert" className="text-xs text-red-700 text-center">
              {profileImage.error}
            </Text>
          ) : null}
          <Text
            accessibilityRole="header"
            className="text-xl font-extrabold text-neutral text-center mt-3"
          >
            {user.fullName}
          </Text>

          <View className="flex-row flex-wrap justify-center items-center gap-2 mt-2">
            {user.publicId ? (
              <View className="bg-tertiary px-3 py-1 rounded-full">
                <Text className="text-[11px] font-bold text-neutral-muted">{user.publicId}</Text>
              </View>
            ) : null}
            {user.isEmailVerified ? (
              <View className="flex-row items-center bg-tertiary px-3 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={13} color={ThemeColors.primary} />
                <Text className="ml-1 text-[11px] font-bold text-primary">Cuenta Verificada</Text>
              </View>
            ) : null}
          </View>

          <View
            style={{ borderCurve: 'continuous' }}
            className="w-full flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 mt-4"
          >
            <Ionicons name="mail-outline" size={18} color={ThemeColors.primary} />
            <View className="flex-1 ml-3">
              <Text className="text-[11px] text-neutral-muted">Correo personal maestro</Text>
              <Text numberOfLines={1} className="text-sm font-bold text-neutral">
                {user.email || '—'}
              </Text>
            </View>
            <View className="bg-tertiary px-2 py-1 rounded-full ml-2">
              <Text className="text-[10px] font-bold text-primary">Principal</Text>
            </View>
          </View>

          {user.hasPassword ? (
            <View
              accessible
              accessibilityLabel="Seguridad 2FA: no activada"
              style={{ borderCurve: 'continuous' }}
              className="w-full flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 mt-3"
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={ThemeColors.mutedText} />
              <View className="flex-1 ml-3">
                <Text className="text-[11px] text-neutral-muted">Seguridad 2FA</Text>
                <Text numberOfLines={1} className="text-sm font-bold text-neutral">
                  Verificación en dos pasos
                </Text>
              </View>
              <View className="bg-tertiary px-2 py-1 rounded-full ml-2">
                <Text className="text-[10px] font-bold text-neutral-muted">No activada</Text>
              </View>
            </View>
          ) : user.isGoogleOnly ? (
            <View
              accessible
              accessibilityLabel="Autenticado con Google"
              style={{ borderCurve: 'continuous' }}
              className="w-full flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 mt-3"
            >
              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3">
                <GoogleLogo size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral">Autenticado con Google</Text>
                <Text className="text-[11px] text-neutral-muted">
                  Tu contraseña y la verificación en dos pasos las gestiona tu cuenta de Google.
                </Text>
              </View>
            </View>
          ) : null}

          <View className="w-full gap-3 mt-4">
            <AppButton
              title="Editar datos"
              icon="create-outline"
              onPress={() => router.push('/edit-profile')}
            />
            {user.hasPassword ? (
              <AppButton
                title="Cambiar contraseña"
                variant="secondary"
                icon="key-outline"
                onPress={() => router.push('/change-password')}
              />
            ) : null}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
              Mis Organizaciones
            </Text>
            <View className="bg-tertiary px-3 py-1 rounded-full">
              <Text className="text-[11px] font-bold text-primary">
                {memberships?.length ?? 0} {memberships?.length === 1 ? 'Entidad' : 'Entidades'}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-neutral-muted">
            Gestiona tu identidad, rol y datos de acceso en cada entidad donde colaboras.
          </Text>

          {membershipsQuery.isPending ? (
            <MembershipsState status="loading" />
          ) : membershipsQuery.isError ? (
            <MembershipsState
              status="error"
              message={membershipsQuery.error.message}
              onRetry={() => membershipsQuery.refetch()}
            />
          ) : membershipsQuery.data.length === 0 ? (
            <MembershipsState status="empty" />
          ) : (
            membershipsQuery.data.map((membership) => (
              <OrganizationAccountCard
                key={membership.id}
                membership={membership}
                email={user.email}
                isActive={membership.organizacion.id === activeOrganizationId}
                onPress={() => {
                  setActiveOrganization(membership.organizacion.id);
                  router.navigate(DEFAULT_TAB_HREF);
                }}
              />
            ))
          )}
        </View>

        <View className="gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Unirme a otra organización con código"
            onPress={() => router.push('/join-organization')}
            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
            className="min-h-14 flex-row items-center bg-cardBg rounded-2xl px-4"
          >
            <View className="w-10 h-10 rounded-xl bg-tertiary items-center justify-center mr-3">
              <Ionicons name="keypad-outline" size={18} color={ThemeColors.primary} />
            </View>
            <Text className="flex-1 text-sm font-bold text-neutral">
              Unirme a otra organización con código
            </Text>
            <Ionicons name="chevron-forward" size={18} color={ThemeColors.mutedText} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear nueva organización"
            onPress={() => router.push('/create-organization')}
            style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
            className="min-h-14 flex-row items-center bg-tertiary rounded-2xl px-4"
          >
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3">
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
            <Text className="flex-1 text-sm font-bold text-primary">Crear nueva organización</Text>
            <Ionicons name="chevron-forward" size={18} color={ThemeColors.primary} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={{ borderCurve: 'continuous' }}
          className={`min-h-12 flex-row items-center justify-center rounded-2xl border border-red-200 bg-red-100 px-4 active:opacity-75 ${
            isSigningOut ? 'opacity-60' : ''
          }`}
        >
          {isSigningOut ? (
            <ActivityIndicator color={ThemeStatus.errorText} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={ThemeStatus.errorText} />
              <Text className="ml-2 text-sm font-bold text-red-700">Cerrar sesión</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
