import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { UserAvatar } from '@/components/ui';
import { ThemeStatus } from '@/constants/theme';
import type { CollaboratorSummary } from '@/schemas/metrics.schema';
import { getInitials } from '@/utils/format';
import { formatHoursShort, formatPercent } from '@/utils/metrics';

interface CollaboratorRowProps {
  collaborator: CollaboratorSummary;
  onPress: () => void;
}

/**
 * Colaborador en el resumen del equipo: asistencia y puntualidad del periodo, horas y, debajo, las
 * horas extra o «Meta alcanzada». Al tocarlo se abre su perfil.
 */
export const CollaboratorRow: React.FC<CollaboratorRowProps> = ({ collaborator: c, onPress }) => {
  const detail =
    c.asistenciaPct === null
      ? 'Sin turno asignado'
      : `${formatPercent(c.asistenciaPct)} asist. · ${formatPercent(c.puntualidadPct)} puntual`;
  const footnote = c.horasExtra > 0 ? `+${formatHoursShort(c.horasExtra)} extra` : c.metaAlcanzada ? 'Meta alcanzada' : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${c.nombre}: ${formatHoursShort(c.horas)}, ${detail}${footnote ? `, ${footnote}` : ''}. Ver perfil`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <View
        style={{ borderCurve: 'continuous' }}
        className="w-full min-h-16 flex-row items-center bg-cardBg rounded-2xl p-4 shadow-sm shadow-primary/10"
      >
        <UserAvatar size={44} initials={getInitials(c.nombre)} uri={c.avatarUrl ?? undefined} />
        <View className="flex-1 mx-3">
          <Text numberOfLines={1} className="text-sm font-extrabold text-neutral">
            {c.nombre}
          </Text>
          <Text numberOfLines={1} className="text-xs text-neutral-muted">
            {detail}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
            {formatHoursShort(c.horas)}
          </Text>
          {footnote ? (
            <Text style={{ color: ThemeStatus.success }} className="text-[11px] font-bold">
              {footnote}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};
