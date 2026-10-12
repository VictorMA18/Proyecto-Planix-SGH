import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { TeamSearchBar } from '@/components/team/TeamSearchBar';
import { ActionSheet, AppButton, UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

import { FieldError, FieldLabel } from './FieldLabel';

interface AssigneesFieldProps {
  members: TeamMember[] | undefined;
  isLoading: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** Personas asignadas: chips con «×» y «+ Asignar», que abre una lista con búsqueda (selección múltiple). */
export const AssigneesField: React.FC<AssigneesFieldProps> = ({ members, isLoading, value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const byId = useMemo(() => new Map((members ?? []).map((m) => [m.id, m])), [members]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (members ?? []).filter(
      (m) => !term || m.nombre.toLowerCase().includes(term) || m.email.toLowerCase().includes(term),
    );
  }, [members, search]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <View>
      <FieldLabel icon="people-outline" text="Asignados" />
      <View className="flex-row flex-wrap items-center gap-2">
        {value.map((id) => {
          const member = byId.get(id);
          if (!member) return null;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`Quitar a ${member.nombre}`}
              onPress={() => toggle(id)}
              className="min-h-11 flex-row items-center bg-inputBg border border-borderBg rounded-full pl-1 pr-3 active:opacity-70"
            >
              <UserAvatar size={28} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
              <Text className="ml-2 text-sm font-semibold text-neutral">{member.nombre.split(' ')[0]}</Text>
              <Ionicons name="close" size={14} color={ThemeColors.mutedText} style={{ marginLeft: 6 }} />
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Asignar personas"
          onPress={() => setOpen(true)}
          className="min-h-11 flex-row items-center rounded-full border border-dashed border-primary/50 px-3 active:opacity-70"
        >
          <Ionicons name="add" size={16} color={ThemeColors.primary} />
          <Text className="ml-1 text-sm font-bold text-primary">Asignar</Text>
        </Pressable>
      </View>
      <FieldError message={error} />

      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        header={
          <View className="gap-3">
            <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
              Asignar personas
            </Text>
            <TeamSearchBar value={search} onChangeText={setSearch} />
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <ActivityIndicator color={ThemeColors.primary} style={{ marginVertical: 16 }} />
          ) : filtered.length === 0 ? (
            <Text className="py-4 text-center text-sm text-neutral-muted">Ningún miembro coincide con la búsqueda.</Text>
          ) : (
            filtered.map((member) => {
              const selected = value.includes(member.id);
              return (
                <Pressable
                  key={member.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${member.nombre}, ${ROLE_NAME[member.rol]}`}
                  onPress={() => toggle(member.id)}
                  className={`min-h-14 flex-row items-center rounded-2xl px-3 active:bg-tertiary ${selected ? 'bg-inputBg' : ''}`}
                >
                  <UserAvatar size={40} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
                  <View className="flex-1 mx-3">
                    <Text numberOfLines={1} className="text-sm font-bold text-neutral">
                      {member.nombre}
                    </Text>
                    <Text className="text-xs text-neutral-muted">{ROLE_NAME[member.rol]}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selected ? ThemeColors.primary : ThemeColors.mutedText}
                  />
                </Pressable>
              );
            })
          )}
        </ScrollView>
        <View className="pt-3">
          <AppButton title={`Listo (${value.length})`} onPress={() => setOpen(false)} />
        </View>
      </ActionSheet>
    </View>
  );
};
