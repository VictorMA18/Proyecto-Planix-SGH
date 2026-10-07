import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { RoleBadge } from '@/components/organizations';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { TeamInvitation } from '@/schemas/team.schema';
import { formatDaysAgo } from '@/utils/format';

interface PendingInvitationRowProps {
  invitation: TeamInvitation;
  /** Muestra «Reenviar» (solo administradores). */
  canManage: boolean;
  isResending: boolean;
  onResend: () => void;
}

export const PendingInvitationRow: React.FC<PendingInvitationRowProps> = ({
  invitation,
  canManage,
  isResending,
  onResend,
}) => {
  const title = invitation.nombre ?? invitation.email;

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg/60 border border-dashed border-borderBg rounded-3xl p-4"
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12">
          <View className="w-12 h-12 rounded-full bg-tertiary items-center justify-center">
            <Ionicons name="mail-outline" size={22} color={ThemeColors.primary} />
          </View>
          <View
            style={{ backgroundColor: ThemeStatus.warning }}
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
          />
        </View>

        <View className="flex-1 ml-3">
          <Text numberOfLines={1} className="text-base font-extrabold text-neutral">
            {title}
          </Text>
          {invitation.nombre ? (
            <Text numberOfLines={1} className="text-xs text-neutral-muted">
              {invitation.email}
            </Text>
          ) : null}
          <View className="flex-row mt-1.5">
            <RoleBadge role={invitation.rol} />
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-borderBg mt-3 pt-3">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color={ThemeStatus.warningText} />
          <Text className="ml-2 text-xs text-neutral-muted">
            Enviada {formatDaysAgo(invitation.enviadaEn)}
          </Text>
        </View>

        {canManage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reenviar invitación a ${title}`}
            accessibilityState={{ disabled: isResending, busy: isResending }}
            disabled={isResending}
            onPress={onResend}
            style={{ borderCurve: 'continuous' }}
            className={`min-h-11 flex-row items-center justify-center rounded-full bg-amber-100 px-4 active:opacity-75 ${
              isResending ? 'opacity-60' : ''
            }`}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={ThemeStatus.warningText} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={14} color={ThemeStatus.warningText} />
                <Text style={{ color: ThemeStatus.warningText }} className="ml-1.5 text-xs font-bold">
                  Reenviar
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};
