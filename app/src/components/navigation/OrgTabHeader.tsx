import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleBadge } from '@/components/organizations';
import { UserAvatar } from '@/components/ui';
import { RoleColors, ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useUserDisplay } from '@/hooks/use-clerk-profile';
import { getInitials } from '@/utils/format';

/** Cabecera de las pestañas: organización activa, rol, notificaciones y acceso a «Mi cuenta». */
export const OrgTabHeader: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUserDisplay();
  const { organization, role } = useActiveOrganization();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top + 8, 16) }}
      className="w-full max-w-[480px] self-center flex-row items-center px-5 pb-3"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Organización ${organization?.nombre ?? ''}. Cambiar de organización`}
        onPress={() => router.navigate('/')}
        style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
        className="shrink min-h-11 flex-row items-center bg-cardBg border border-borderBg rounded-2xl pl-2 pr-3"
      >
        <View
          style={{ backgroundColor: role ? RoleColors[role].avatarBg : ThemeColors.primary }}
          className="w-8 h-8 rounded-lg items-center justify-center"
        >
          <Text className="text-xs font-bold text-white">
            {getInitials(organization?.nombre ?? '')}
          </Text>
        </View>
        <Text numberOfLines={1} className="shrink mx-2 max-w-[120px] text-sm font-bold text-neutral">
          {organization?.nombre ?? 'Organización'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={ThemeColors.mutedText} />
      </Pressable>

      {role ? (
        <View className="ml-2">
          <RoleBadge role={role} />
        </View>
      ) : null}

      <View className="flex-1" />

      <View
        accessible
        accessibilityLabel="Notificaciones"
        className="w-11 h-11 items-center justify-center"
      >
        <Ionicons name="notifications-outline" size={22} color={ThemeColors.neutral} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir mi cuenta"
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
      >
        <UserAvatar initials={user.initials} uri={user.imageUrl} size={40} />
      </Pressable>
    </View>
  );
};
