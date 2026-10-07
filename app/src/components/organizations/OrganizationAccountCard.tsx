import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { ROLE_ACCESS_SUMMARY } from '@/constants/roles';
import { RoleColors, ThemeColors } from '@/constants/theme';
import type { Membership } from '@/types/organization';
import { formatDate, formatMembers, formatTimeZone, getInitials } from '@/utils/format';

import { RoleBadge } from './RoleBadge';

const DetailRow: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <View className="flex-row justify-between gap-3 py-1">
    <Text className="text-xs text-neutral-muted">{label}</Text>
    <Text
      style={accent ? { color: accent } : undefined}
      className="flex-1 text-right text-xs font-bold text-neutral"
    >
      {value}
    </Text>
  </View>
);

interface OrganizationAccountCardProps {
  membership: Membership;
  /** Correo de la cuenta (Clerk) con el que el usuario figura en la organización. */
  email: string;
  isActive: boolean;
  onPress: () => void;
}

export const OrganizationAccountCard: React.FC<OrganizationAccountCardProps> = ({
  membership,
  email,
  isActive,
  onPress,
}) => {
  const { organizacion } = membership;
  const colors = RoleColors[membership.rol];

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full flex-row bg-cardBg rounded-3xl overflow-hidden shadow-sm shadow-primary/10"
    >
      {isActive ? <View style={{ backgroundColor: colors.avatarBg }} className="w-1" /> : null}

      <View className="flex-1 p-4">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: colors.badgeBg, borderCurve: 'continuous' }}
            className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
          >
            <Text style={{ color: colors.accent }} className="text-base font-bold">
              {getInitials(organizacion.nombre)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-neutral">{organizacion.nombre}</Text>
            <Text className="text-xs text-neutral-muted">
              {formatMembers(organizacion.miembrosActivos)}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap items-center gap-2 mt-3">
          <RoleBadge role={membership.rol} />
          {isActive ? (
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1" />
              <Text className="text-[10px] font-bold text-primary">Sesión actual</Text>
            </View>
          ) : null}
        </View>

        <View
          style={{ borderCurve: 'continuous' }}
          className="bg-inputBg rounded-2xl p-3 mt-3 border border-borderBg"
        >
          <DetailRow label="Rol:" value={colors.label} />
          <DetailRow label="Zona horaria:" value={formatTimeZone(organizacion.zonaHoraria)} />
          <DetailRow label="Miembro desde:" value={formatDate(membership.fechaIngreso)} />
          <DetailRow label="Correo:" value={email || '—'} accent={ThemeColors.primary} />
          <View className="flex-row items-center mt-2 pt-2 border-t border-borderBg">
            <Ionicons name="shield-checkmark-outline" size={14} color={ThemeColors.primary} />
            <Text className="flex-1 ml-2 text-[11px] text-neutral-muted">
              {ROLE_ACCESS_SUMMARY[membership.rol]}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <AppButton
            title={isActive ? 'Entrar a esta Organización' : 'Cambiar a esta Organización'}
            variant={isActive ? 'primary' : 'secondary'}
            icon={isActive ? 'log-in-outline' : 'swap-horizontal-outline'}
            onPress={onPress}
          />
        </View>
      </View>
    </View>
  );
};
