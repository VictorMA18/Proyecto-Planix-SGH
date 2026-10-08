import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import {
  ChangeRoleModal,
  DigitalCredentialCard,
  MemberMetrics,
  MemberProfileHeader,
  MemberWorkInfo,
} from '@/components/team';
import { ScreenHeader } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useMemberProfile } from '@/services/team';
import { canModifyMember } from '@/utils/team-permissions';

export default function MemberProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { miembroId } = useLocalSearchParams<{ miembroId: string }>();
  const { organization, membership, role } = useActiveOrganization();
  const query = useMemberProfile(miembroId);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);

  const organizationName = organization?.nombre ?? 'la organización';

  return (
    <SafeAreaView className="flex-1 bg-screenBg" edges={['left', 'right']}>
      <ScreenHeader title="Perfil del miembro" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        {query.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando el perfil…" />
        ) : query.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar el perfil"
            message={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : (
          <View className="gap-6">
            <MemberProfileHeader
              profile={query.data.profile}
              canChangeRole={canModifyMember({
                viewerRole: role,
                viewerMembershipId: membership?.id,
                member: query.data.profile,
              })}
              onChangeRole={() => setChangeRoleOpen(true)}
            />
            <DigitalCredentialCard sample={query.data.sample} />
            <MemberMetrics sample={query.data.sample} organizationName={organizationName} />
            <MemberWorkInfo profile={query.data.profile} organizationName={organizationName} />
          </View>
        )}
      </ScrollView>

      <ChangeRoleModal
        member={
          changeRoleOpen && query.data
            ? { id: query.data.profile.id, nombre: query.data.profile.usuario.nombre, rol: query.data.profile.rol }
            : null
        }
        onClose={() => setChangeRoleOpen(false)}
      />
    </SafeAreaView>
  );
}
