import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MembershipsState } from '@/components/organizations';
import {
  ChangeRoleModal,
  InviteCodeModal,
  InviteMemberModal,
  MemberActionsMenu,
  PendingInvitationRow,
  RemoveMemberModal,
  TeamFilterChips,
  TeamMemberRow,
  TeamPagination,
  TeamSearchBar,
  type GeneratedInvite,
} from '@/components/team';
import type { TeamMember } from '@/schemas/team.schema';
import { canModifyMember } from '@/utils/team-permissions';
import { AppButton } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useActiveOrganization } from '@/hooks/use-active-membership';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useResendInvitation, useTeam } from '@/services/team';
import { useTeamStore } from '@/stores/useTeamStore';

export default function TeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization, membership, role, canManageTeam } = useActiveOrganization();
  const { search, filter, page, setSearch, setFilter, setPage, reset } = useTeamStore();
  const debouncedSearch = useDebouncedValue(search, 300);

  const team = useTeam({ search: debouncedSearch, filter, page });
  const resend = useResendInvitation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [generated, setGenerated] = useState<GeneratedInvite | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [menuMember, setMenuMember] = useState<TeamMember | null>(null);
  const [roleMember, setRoleMember] = useState<TeamMember | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);

  // Al cambiar de organización, filtros y página empiezan de cero.
  useEffect(() => reset(), [organization?.id, reset]);

  const data = team.data;
  const activeMembers = data ? data.conteos.todos - data.conteos.pendientes : 0;

  // Al pasar del menú a otro modal se espera a que el primero termine de cerrarse
  // (dos modales a la vez fallan en iOS).
  const afterMenuClosed = (action: () => void) => {
    setMenuMember(null);
    setTimeout(action, 300);
  };

  const handleResend = (id: string) => {
    setResendingId(id);
    resend.mutate(id, { onSettled: () => setResendingId(null) });
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-4"
        contentContainerStyle={{ paddingBottom: 24 + Math.max(insets.bottom, 0) / 2 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={team.isRefetching && !team.isPlaceholderData}
            onRefresh={() => team.refetch()}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        <View>
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text accessibilityRole="header" className="text-3xl font-extrabold text-neutral">
              Equipo y Miembros
            </Text>
            {data ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="flex-row items-center bg-tertiary rounded-full px-3 py-1.5"
              >
                <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                <Text className="text-xs font-bold text-primary">
                  {activeMembers} {activeMembers === 1 ? 'colaborador activo' : 'colaboradores activos'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm text-neutral-muted mt-1">
            Administra los accesos, los roles y las invitaciones del personal de tu organización.
          </Text>
        </View>

        <TeamSearchBar value={search} onChangeText={setSearch} />

        {canManageTeam ? (
          <AppButton
            title="Invitar nuevo miembro"
            icon="person-add-outline"
            onPress={() => setInviteOpen(true)}
          />
        ) : null}

        <TeamFilterChips value={filter} counts={data?.conteos} onChange={setFilter} />

        {team.isPending ? (
          <MembershipsState status="loading" loadingText="Cargando el equipo…" />
        ) : team.isError ? (
          <MembershipsState
            status="error"
            errorTitle="No pudimos cargar el equipo"
            message={team.error.message}
            onRetry={() => team.refetch()}
          />
        ) : team.data.items.length === 0 ? (
          <MembershipsState
            status="empty"
            emptyIcon="people-outline"
            emptyTitle="Sin resultados"
            emptyMessage="No hay miembros que coincidan con tu búsqueda o filtro."
          />
        ) : (
          <View className={`gap-4 ${team.isPlaceholderData ? 'opacity-60' : ''}`}>
            {team.data.items.map((item) =>
              item.tipo === 'MIEMBRO' ? (
                <TeamMemberRow key={item.id} member={item} onMenuPress={() => setMenuMember(item)} />
              ) : (
                <PendingInvitationRow
                  key={item.id}
                  invitation={item}
                  canManage={canManageTeam}
                  isResending={resendingId === item.id}
                  onResend={() => handleResend(item.id)}
                />
              ),
            )}
          </View>
        )}

        {data && data.total > 0 ? (
          <TeamPagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
        ) : null}
      </ScrollView>

      <InviteMemberModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onGenerated={(invite) => {
          setInviteOpen(false);
          setGenerated(invite);
        }}
      />
      <InviteCodeModal
        invite={generated}
        organizationName={organization?.nombre ?? 'la organización'}
        onClose={() => setGenerated(null)}
      />

      <MemberActionsMenu
        member={menuMember}
        canModify={
          !!menuMember &&
          canModifyMember({ viewerRole: role, viewerMembershipId: membership?.id, member: menuMember })
        }
        onClose={() => setMenuMember(null)}
        onViewProfile={(member) => afterMenuClosed(() => router.push(`/miembro/${member.id}`))}
        onChangeRole={(member) => afterMenuClosed(() => setRoleMember(member))}
        onRemove={(member) => afterMenuClosed(() => setRemoveMember(member))}
      />
      <ChangeRoleModal member={roleMember} onClose={() => setRoleMember(null)} />
      <RemoveMemberModal
        member={removeMember}
        organizationName={organization?.nombre ?? 'la organización'}
        onClose={() => setRemoveMember(null)}
      />
    </View>
  );
}
