import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

import { SectionHeader } from '../shared';

interface OnShiftColleaguesProps {
  colleagues: TeamMember[] | undefined;
  isPending: boolean;
  isError: boolean;
}

/** Compañeros de la organización (personas reales del equipo). */
export const OnShiftColleagues: React.FC<OnShiftColleaguesProps> = ({ colleagues, isPending, isError }) => (
  <View className="gap-4">
    <SectionHeader
      title="Tu equipo"
      trailing={colleagues && colleagues.length > 0 ? `${colleagues.length} compañeros` : undefined}
    />

    {isPending ? (
      <ActivityIndicator color={ThemeColors.primary} />
    ) : isError ? (
      <Text className="text-sm text-neutral-muted">No pudimos cargar a tus compañeros.</Text>
    ) : !colleagues || colleagues.length === 0 ? (
      <Text className="text-sm text-neutral-muted">Aún no hay compañeros en tu organización.</Text>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 flex-grow-0"
        contentContainerClassName="px-5 gap-3"
      >
        {colleagues.map((colleague) => (
          <View
            key={colleague.id}
            style={{ borderCurve: 'continuous' }}
            className="flex-row items-center bg-cardBg rounded-2xl p-3 pr-5 shadow-sm shadow-primary/10"
          >
            <UserAvatar
              size={44}
              initials={getInitials(colleague.nombre)}
              uri={colleague.avatarUrl ?? undefined}
            />
            <View className="ml-3">
              <Text numberOfLines={1} className="max-w-[140px] text-sm font-extrabold text-neutral">
                {colleague.nombre}
              </Text>
              <Text className="text-xs font-semibold text-neutral-muted">{ROLE_NAME[colleague.rol]}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    )}
  </View>
);
