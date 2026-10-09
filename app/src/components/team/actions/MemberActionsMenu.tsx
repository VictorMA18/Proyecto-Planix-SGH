import React from 'react';
import { Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { ActionSheet, ActionSheetItem, UserAvatar } from '@/components/ui';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

interface MemberActionsMenuProps {
  member: TeamMember | null;
  /** Si el usuario puede cambiar el rol o quitar a este miembro. */
  canModify: boolean;
  onClose: () => void;
  onViewProfile: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}

/** Menú ⋮ de cada miembro: ver perfil, cambiar rol y quitar del equipo. */
export const MemberActionsMenu: React.FC<MemberActionsMenuProps> = ({
  member,
  canModify,
  onClose,
  onViewProfile,
  onChangeRole,
  onRemove,
}) => {
  if (!member) return null;

  return (
    <ActionSheet
      visible
      onClose={onClose}
      header={
        <View className="flex-row items-center">
          <UserAvatar size={48} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
          <View className="flex-1 ml-3">
            <Text numberOfLines={1} className="text-base font-extrabold text-neutral">
              {member.nombre}
            </Text>
            <View className="flex-row mt-1">
              <RoleBadge role={member.rol} />
            </View>
          </View>
        </View>
      }
    >
      <ActionSheetItem
        icon="person-outline"
        label="Ver perfil"
        description="Datos, credencial y métricas del miembro"
        onPress={() => onViewProfile(member)}
      />
      {canModify ? (
        <>
          <ActionSheetItem
            icon="swap-horizontal-outline"
            label="Cambiar rol"
            description="Define qué puede hacer en la organización"
            onPress={() => onChangeRole(member)}
          />
          <ActionSheetItem
            icon="person-remove-outline"
            label="Quitar del equipo"
            description="Pierde el acceso a la organización"
            destructive
            onPress={() => onRemove(member)}
          />
        </>
      ) : null}
    </ActionSheet>
  );
};
