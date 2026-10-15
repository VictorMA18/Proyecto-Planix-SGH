import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { MetricsPeriod } from '@/schemas/metrics.schema';

import { CollaboratorRow } from './CollaboratorRow';

interface CollaboratorsSectionProps {
  collaborators: NonNullable<MetricsPeriod['colaboradores']>;
  onSeeAll: () => void;
  onOpenMember: (memberId: string) => void;
}

/** «Detalle de colaboradores»: los que más horas suman en el periodo y el acceso a «Ver todos». */
export const CollaboratorsSection: React.FC<CollaboratorsSectionProps> = ({ collaborators, onSeeAll, onOpenMember }) => (
  <View className="gap-3">
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-2">
        <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
          Detalle de colaboradores
        </Text>
        <View className="min-w-6 items-center rounded-full bg-tertiary px-2 py-0.5">
          <Text className="text-[11px] font-bold text-primary">{collaborators.total}</Text>
        </View>
      </View>
      {collaborators.total > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver los ${collaborators.total} colaboradores`}
          onPress={onSeeAll}
          hitSlop={8}
          className="min-h-11 flex-row items-center active:opacity-70"
        >
          <Text className="text-sm font-bold text-primary">Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={ThemeColors.primary} />
        </Pressable>
      ) : null}
    </View>

    {collaborators.top.length === 0 ? (
      <Text className="text-sm text-neutral-muted">Aún no hay colaboradores activos.</Text>
    ) : (
      collaborators.top.map((c) => (
        <CollaboratorRow key={c.miembroId} collaborator={c} onPress={() => onOpenMember(c.miembroId)} />
      ))
    )}
  </View>
);
