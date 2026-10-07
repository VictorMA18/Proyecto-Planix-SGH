import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { RoleColors } from '@/constants/theme';
import type { OrganizationRole } from '@/types/organization';

export const RoleBadge: React.FC<{ role: OrganizationRole }> = ({ role }) => {
  const colors = RoleColors[role];

  return (
    <View
      accessibilityLabel={`Rol: ${colors.label}`}
      style={{ backgroundColor: colors.badgeBg, borderCurve: 'continuous' }}
      className="flex-row items-center px-2 py-1 rounded-full"
    >
      <Ionicons name={colors.icon} size={12} color={colors.accent} />
      <Text style={{ color: colors.accent }} className="ml-1 text-[10px] font-bold">
        {colors.label}
      </Text>
    </View>
  );
};
