import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { OptionRow } from '@/components/tasks/OptionRow';
import { ActionSheet, UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

import { TeamSearchBar } from './TeamSearchBar';

interface MemberPickerSheetProps {
  visible: boolean;
  title: string;
  /** Texto de la opción que quita el filtro («Todos los miembros», «Todo el equipo»). */
  allLabel: string;
  allDescription?: string;
  members: TeamMember[] | undefined;
  isLoading: boolean;
  value: string | null;
  onChange: (memberId: string | null) => void;
  onClose: () => void;
  /** Membresía de quien mira: se fija primero, marcada «Tú», y el resto va bajo «Equipo». */
  currentMemberId?: string;
}

/** Elegir un miembro del equipo (o todos), con búsqueda por nombre o correo. */
export const MemberPickerSheet: React.FC<MemberPickerSheetProps> = ({
  visible,
  title,
  allLabel,
  allDescription,
  members,
  isLoading,
  value,
  onChange,
  onClose,
  currentMemberId,
}) => {
  const [search, setSearch] = useState('');

  const { self, others } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (members ?? []).filter(
      (m) => !term || m.nombre.toLowerCase().includes(term) || m.email.toLowerCase().includes(term),
    );
    return {
      self: list.find((m) => m.id === currentMemberId) ?? null,
      others: list.filter((m) => m.id !== currentMemberId),
    };
  }, [members, search, currentMemberId]);

  const choose = (memberId: string | null) => {
    onChange(memberId);
    setSearch('');
    onClose();
  };

  const memberRow = (member: TeamMember, isSelf = false) => (
    <OptionRow
      key={member.id}
      label={member.nombre}
      badge={isSelf ? 'Tú' : undefined}
      description={isSelf ? 'Tus métricas individuales' : ROLE_NAME[member.rol]}
      selected={value === member.id}
      leading={<UserAvatar size={40} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />}
      onPress={() => choose(member.id)}
    />
  );

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      header={
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
            {title}
          </Text>
          <TeamSearchBar value={search} onChangeText={setSearch} />
        </View>
      }
    >
      <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" accessibilityRole="radiogroup">
        {!search ? (
          <OptionRow
            label={allLabel}
            description={allDescription}
            selected={value === null}
            leading={
              <View className="w-10 h-10 rounded-full bg-tertiary items-center justify-center">
                <Ionicons name="people" size={20} color={ThemeColors.primary} />
              </View>
            }
            onPress={() => choose(null)}
          />
        ) : null}
        {isLoading ? (
          <ActivityIndicator color={ThemeColors.primary} style={{ marginVertical: 16 }} />
        ) : !self && others.length === 0 ? (
          <Text className="py-4 text-center text-sm text-neutral-muted">Ningún miembro coincide con la búsqueda.</Text>
        ) : (
          <>
            {self ? memberRow(self, true) : null}
            {currentMemberId && others.length > 0 ? (
              <Text className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-neutral-muted">EQUIPO</Text>
            ) : null}
            {others.map((member) => memberRow(member))}
          </>
        )}
      </ScrollView>
    </ActionSheet>
  );
};
