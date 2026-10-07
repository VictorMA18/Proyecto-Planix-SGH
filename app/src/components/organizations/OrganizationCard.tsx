import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { RoleColors, ThemeColors, ThemeStatus } from '@/constants/theme';
import type { Membership, OrganizationRole } from '@/types/organization';
import { formatMembers, formatTimeZone, getInitials } from '@/utils/format';

import { RoleBadge } from './RoleBadge';

const ACTION_BY_ROLE: Record<
  OrganizationRole,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  SUPER_ADMIN: { label: 'Abrir Dashboard', icon: 'arrow-forward' },
  ADMIN: { label: 'Abrir Dashboard', icon: 'arrow-forward' },
  SUPERVISOR: { label: 'Cambiar a esta', icon: 'swap-horizontal' },
  EMPLEADO: { label: 'Ver mi jornada', icon: 'arrow-forward' },
};

interface OrganizationCardProps {
  membership: Membership;
  isActive: boolean;
  onPress: () => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  membership,
  isActive,
  onPress,
}) => {
  const { organizacion } = membership;
  const colors = RoleColors[membership.rol];
  const action = ACTION_BY_ROLE[membership.rol];

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        borderCurve: 'continuous',
      }}
      className="w-full rounded-3xl border p-4"
    >
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: colors.avatarBg, borderCurve: 'continuous' }}
          className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
        >
          <Text className="text-base font-bold text-white">{getInitials(organizacion.nombre)}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2 mb-1">
            {isActive ? (
              <View
                style={{ backgroundColor: ThemeStatus.successBg, borderCurve: 'continuous' }}
                className="flex-row items-center px-2 py-1 rounded-full"
              >
                <View
                  style={{ backgroundColor: ThemeStatus.success }}
                  className="w-1.5 h-1.5 rounded-full mr-1"
                />
                <Text style={{ color: ThemeStatus.success }} className="text-[10px] font-bold">
                  ACTIVA
                </Text>
              </View>
            ) : null}
            <RoleBadge role={membership.rol} />
          </View>
          <Text className="text-xs text-neutral-muted">
            {formatTimeZone(organizacion.zonaHoraria)}
          </Text>
          <Text className="text-lg font-extrabold text-neutral">{organizacion.nombre}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-3 mt-4">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color={ThemeColors.mutedText} />
          <Text className="ml-2 text-xs text-neutral-muted">
            {formatMembers(organizacion.miembrosActivos)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label} de ${organizacion.nombre}`}
          onPress={onPress}
          style={({ pressed }) => [{ borderCurve: 'continuous', opacity: pressed ? 0.75 : 1 }]}
          className="min-h-11 flex-row items-center bg-white rounded-full px-4"
        >
          <Text style={{ color: colors.accent }} className="text-xs font-bold mr-1.5">
            {action.label}
          </Text>
          <Ionicons name={action.icon} size={14} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
};
