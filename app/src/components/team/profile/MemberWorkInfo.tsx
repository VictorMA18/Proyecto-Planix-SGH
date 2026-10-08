import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { ROLE_SHORT_ACCESS } from '@/constants/roles';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { MemberProfile } from '@/schemas/team.schema';
import { formatDate, formatTenure } from '@/utils/format';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, children, trailing }) => (
  <View
    style={{ borderCurve: 'continuous' }}
    className="flex-row items-center bg-inputBg rounded-2xl p-4"
  >
    <View className="w-11 h-11 rounded-xl bg-white items-center justify-center mr-4">
      <Ionicons name={icon} size={20} color={ThemeColors.primary} />
    </View>
    <View className="flex-1">
      <Text className="text-xs text-neutral-muted mb-1">{label}</Text>
      {children}
    </View>
    {trailing}
  </View>
);

interface MemberWorkInfoProps {
  profile: MemberProfile;
  organizationName: string;
}

/** Ficha laboral con datos reales del backend: correo, rol e ingreso con su antigüedad. */
export const MemberWorkInfo: React.FC<MemberWorkInfoProps> = ({ profile, organizationName }) => {
  const active = profile.estado === 'ACTIVO';
  const tenure = formatTenure(profile.fechaIngreso);

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-6 shadow-sm shadow-primary/10"
    >
      <View className="flex-row items-center justify-between gap-3 mb-5">
        <View className="flex-1 flex-row items-center">
          <Ionicons name="document-text-outline" size={20} color={ThemeColors.primary} />
          <Text accessibilityRole="header" className="flex-1 ml-2 text-lg font-extrabold text-neutral">
            Ficha laboral en {organizationName}
          </Text>
        </View>
        <View
          style={{ backgroundColor: active ? ThemeStatus.successBg : ThemeColors.tertiary, borderCurve: 'continuous' }}
          className="rounded-full px-3 py-1"
        >
          <Text
            style={{ color: active ? ThemeStatus.success : ThemeColors.mutedText }}
            className="text-[11px] font-bold"
          >
            {active ? 'Vigente' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <InfoRow
          icon="at-outline"
          label="Correo"
          trailing={
            <Ionicons
              name={profile.usuario.emailVerificado ? 'checkmark-circle' : 'alert-circle-outline'}
              size={22}
              color={profile.usuario.emailVerificado ? ThemeStatus.success : ThemeStatus.warning}
              accessibilityLabel={profile.usuario.emailVerificado ? 'Correo verificado' : 'Correo sin verificar'}
            />
          }
        >
          <Text numberOfLines={1} className="text-base font-bold text-neutral">
            {profile.usuario.email}
          </Text>
        </InfoRow>

        <InfoRow icon="shield-checkmark-outline" label="Rol en la organización">
          <View className="flex-row flex-wrap items-center gap-2">
            <RoleBadge role={profile.rol} />
          </View>
          <Text className="text-xs text-neutral-muted mt-1.5">{ROLE_SHORT_ACCESS[profile.rol]}</Text>
        </InfoRow>

        <InfoRow icon="calendar-outline" label="Fecha de ingreso / antigüedad">
          <Text className="text-base font-bold text-neutral">
            {formatDate(profile.fechaIngreso)}
            {tenure ? <Text className="text-sm font-medium text-neutral-muted">  ({tenure})</Text> : null}
          </Text>
        </InfoRow>
      </View>
    </View>
  );
};
