import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleBadge } from '@/components/organizations';
import { UserAvatar } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

interface MenuActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  destructive?: boolean;
  onPress: () => void;
}

const MenuAction: React.FC<MenuActionProps> = ({ icon, label, description, destructive, onPress }) => {
  const color = destructive ? ThemeStatus.errorText : ThemeColors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ borderCurve: 'continuous' }}
      className="min-h-16 flex-row items-center rounded-2xl px-3 active:bg-tertiary"
    >
      <View
        style={{ backgroundColor: destructive ? ThemeStatus.errorBg : ThemeColors.tertiary }}
        className="w-11 h-11 rounded-xl items-center justify-center mr-3"
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text
          style={destructive ? { color: ThemeStatus.errorText } : undefined}
          className="text-base font-bold text-neutral"
        >
          {label}
        </Text>
        <Text className="text-xs text-neutral-muted">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={ThemeColors.mutedText} />
    </Pressable>
  );
};

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
  const insets = useSafeAreaInsets();
  if (!member) return null;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{ borderCurve: 'continuous', paddingBottom: Math.max(insets.bottom, 0) + 20 }}
          className="w-full max-w-[480px] self-center bg-cardBg rounded-t-3xl px-5 pt-5"
        >
          <View className="flex-row items-center mb-4 px-1">
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

          <View className="gap-1 border-t border-borderBg pt-3">
            <MenuAction
              icon="person-outline"
              label="Ver perfil"
              description="Datos, credencial y métricas del miembro"
              onPress={() => onViewProfile(member)}
            />
            {canModify ? (
              <>
                <MenuAction
                  icon="swap-horizontal-outline"
                  label="Cambiar rol"
                  description="Define qué puede hacer en la organización"
                  onPress={() => onChangeRole(member)}
                />
                <MenuAction
                  icon="person-remove-outline"
                  label="Quitar del equipo"
                  description="Pierde el acceso a la organización"
                  destructive
                  onPress={() => onRemove(member)}
                />
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};
