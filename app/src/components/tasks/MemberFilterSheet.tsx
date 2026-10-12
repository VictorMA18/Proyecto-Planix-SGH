import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { TeamSearchBar } from '@/components/team/TeamSearchBar';
import { ActionSheet, UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

import { OptionRow } from './OptionRow';

interface MemberFilterSheetProps {
  visible: boolean;
  members: TeamMember[] | undefined;
  isLoading: boolean;
  value: string | null;
  onChange: (memberId: string | null) => void;
  onClose: () => void;
}

/** Elegir el miembro cuyas tareas se quieren ver (o todos), con búsqueda. */
export const MemberFilterSheet: React.FC<MemberFilterSheetProps> = ({
  visible,
  members,
  isLoading,
  value,
  onChange,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = members ?? [];
    return term
      ? list.filter((m) => m.nombre.toLowerCase().includes(term) || m.email.toLowerCase().includes(term))
      : list;
  }, [members, search]);

  const choose = (memberId: string | null) => {
    onChange(memberId);
    setSearch('');
    onClose();
  };

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      header={
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
            Filtrar por miembro
          </Text>
          <TeamSearchBar value={search} onChangeText={setSearch} />
        </View>
      }
    >
      <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled" accessibilityRole="radiogroup">
        {!search ? (
          <OptionRow
            label="Todos los miembros"
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
        ) : filtered.length === 0 ? (
          <Text className="py-4 text-center text-sm text-neutral-muted">Ningún miembro coincide con la búsqueda.</Text>
        ) : (
          filtered.map((member) => (
            <OptionRow
              key={member.id}
              label={member.nombre}
              description={ROLE_NAME[member.rol]}
              selected={value === member.id}
              leading={<UserAvatar size={40} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />}
              onPress={() => choose(member.id)}
            />
          ))
        )}
      </ScrollView>
    </ActionSheet>
  );
};
