import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { UserAvatar } from '@/components/ui';
import { ROLE_SHORT_ACCESS } from '@/constants/roles';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { formatDuration, getInitials } from '@/utils/format';

interface StatusPillProps {
  text: string;
  color: string;
  background: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const StatusPill: React.FC<StatusPillProps> = ({ text, color, background, icon }) => (
  <View
    style={{ backgroundColor: background, borderCurve: 'continuous' }}
    className="flex-row items-center rounded-full px-2.5 py-1"
  >
    {icon ? <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} /> : null}
    <Text style={{ color }} className="text-[11px] font-bold">
      {text}
    </Text>
  </View>
);

interface TeamMemberRowProps {
  member: TeamMember;
  /** Abre el menú de acciones del miembro (ver perfil, cambiar rol, quitar del equipo). */
  onMenuPress: () => void;
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, onMenuPress }) => {
  const onShift = !!member.enTurnoDesde;

  const status = onShift ? (
    <StatusPill
      icon="time-outline"
      text={`En turno activo (${formatDuration(Date.now() - new Date(member.enTurnoDesde!).getTime())})`}
      color={ThemeStatus.info}
      background={ThemeStatus.infoBg}
    />
  ) : member.estado === 'ACTIVO' ? (
    <StatusPill text="Activo" color={ThemeStatus.success} background={ThemeStatus.successBg} />
  ) : (
    <StatusPill text="Inactivo" color={ThemeColors.mutedText} background={ThemeColors.tertiary} />
  );

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-4 shadow-sm shadow-primary/10"
    >
      <View className="flex-row items-start">
        <UserAvatar
          size={48}
          initials={getInitials(member.nombre)}
          uri={member.avatarUrl ?? undefined}
          showStatusDot
          statusColor={onShift ? ThemeStatus.info : ThemeStatus.success}
        />

        <View className="flex-1 ml-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text numberOfLines={1} className="shrink text-base font-extrabold text-neutral">
              {member.nombre}
            </Text>
            <RoleBadge role={member.rol} />
          </View>
          <Text numberOfLines={1} className="text-xs text-neutral-muted mt-0.5">
            {member.email}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Acciones de ${member.nombre}`}
          onPress={onMenuPress}
          hitSlop={4}
          className="w-11 h-11 -mr-2 -mt-2 items-center justify-center rounded-full active:bg-tertiary"
        >
          <Ionicons name="ellipsis-vertical" size={18} color={ThemeColors.mutedText} />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-borderBg mt-3 pt-3">
        <View className="flex-1 flex-row items-center min-w-[140px]">
          <Ionicons
            name={member.turno ? 'business-outline' : 'shield-checkmark-outline'}
            size={16}
            color={ThemeColors.primary}
          />
          <Text numberOfLines={1} className="shrink ml-2 text-xs text-neutral-muted">
            {member.turno ?? ROLE_SHORT_ACCESS[member.rol]}
          </Text>
        </View>
        {status}
      </View>
    </View>
  );
};
