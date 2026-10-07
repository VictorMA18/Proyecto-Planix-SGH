import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState, OrganizationCard } from '@/components/organizations';
import { AppButton, ScreenHeader, UserAvatar } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveMembership } from '@/hooks/use-active-membership';
import { useClerkProfileSync, useUserDisplay } from '@/hooks/use-clerk-profile';
import { useMemberships } from '@/services/organizations';

export default function OrganizationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUserDisplay();
  const membershipsQuery = useMemberships();
  const memberships = membershipsQuery.data;
  const { activeOrganizationId, setActiveOrganization } = useActiveMembership(memberships);

  useClerkProfileSync();

  const count = memberships?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir mi cuenta"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            className="min-h-11 flex-row items-center"
          >
            <View className="items-end mr-2">
              <Text numberOfLines={1} className="max-w-[140px] text-xs font-bold text-neutral">
                {user.fullName}
              </Text>
              <Text className="text-[11px] text-neutral-muted">Mi Cuenta</Text>
            </View>
            <UserAvatar initials={user.initials} uri={user.imageUrl} size={44} showStatusDot />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={membershipsQuery.isRefetching}
            onRefresh={() => membershipsQuery.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <View>
          <Text accessibilityRole="header" className="text-3xl font-extrabold text-neutral">
            Tus organizaciones
          </Text>
          <Text className="text-sm text-neutral-muted mt-1">
            {count > 0
              ? `Tienes acceso a ${count} ${count === 1 ? 'organización' : 'organizaciones'} con roles independientes. Selecciona con cuál deseas operar hoy.`
              : 'Aquí aparecerán las organizaciones a las que perteneces.'}
          </Text>
        </View>

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
            <OrganizationCard
              key={membership.id}
              membership={membership}
              isActive={membership.organizacion.id === activeOrganizationId}
              onPress={() => setActiveOrganization(membership.organizacion.id)}
            />
          ))
        )}

        <View
          style={{ borderCurve: 'continuous' }}
          className="flex-row items-center bg-tertiary/60 rounded-2xl p-4"
        >
          <Ionicons name="sparkles-outline" size={20} color={ThemeColors.primary} />
          <View className="flex-1 ml-3">
            <Text className="text-xs font-bold text-neutral">Gestión Unificada PLANYX</Text>
            <Text className="text-xs text-neutral-muted">
              Tus fichajes y permisos se sincronizan en la nube.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unirme con código de invitación"
          onPress={() => router.push('/join-organization')}
          style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
          className="min-h-12 flex-row items-center justify-center bg-cardBg border border-borderBg rounded-2xl px-4"
        >
          <Ionicons name="key-outline" size={16} color={ThemeColors.neutral} />
          <Text className="ml-2 text-sm font-bold text-neutral">
            + Unirme con código de invitación
          </Text>
        </Pressable>

        <AppButton
          title="Crear nueva organización"
          icon="add-circle-outline"
          onPress={() => router.push('/create-organization')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
