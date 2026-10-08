import React from 'react';
import { Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { AppButton, UserAvatar } from '@/components/ui';
import type { MemberProfile } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

interface MemberProfileHeaderProps {
  profile: MemberProfile;
  /** Muestra el botón «Cambiar rol» (solo si quien mira puede modificar a este miembro). */
  canChangeRole: boolean;
  onChangeRole: () => void;
}

/** Código corto y estable del miembro, derivado de su id (`PLX-1A2B`). */
const memberCode = (id: string) => `PLX-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

export const MemberProfileHeader: React.FC<MemberProfileHeaderProps> = ({
  profile,
  canChangeRole,
  onChangeRole,
}) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="w-full bg-cardBg rounded-3xl p-6 shadow-sm shadow-primary/10"
  >
    <View className="flex-row items-center">
      <UserAvatar
        size={80}
        initials={getInitials(profile.usuario.nombre)}
        uri={profile.usuario.avatarUrl ?? undefined}
        verified={profile.usuario.emailVerificado}
      />

      <View className="flex-1 ml-4">
        <Text accessibilityRole="header" numberOfLines={2} className="text-xl font-extrabold text-neutral">
          {profile.usuario.nombre}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2 mt-2">
          <View className="bg-tertiary rounded-full px-2.5 py-1">
            <Text className="text-[11px] font-bold text-neutral-muted">ID: {memberCode(profile.id)}</Text>
          </View>
          <RoleBadge role={profile.rol} />
        </View>
      </View>
    </View>

    {canChangeRole ? (
      <View className="mt-6 pt-6 border-t border-borderBg">
        <AppButton
          title="Cambiar rol"
          variant="secondary"
          icon="swap-horizontal-outline"
          onPress={onChangeRole}
        />
      </View>
    ) : null}
  </View>
);
