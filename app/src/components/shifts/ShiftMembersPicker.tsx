import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TeamSearchBar } from '@/components/team/TeamSearchBar';
import { UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

const MAX_VISIBLE = 50;

interface ShiftMembersPickerProps {
  members: TeamMember[] | undefined;
  isLoading: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Selección de los miembros asignados a la plantilla, con búsqueda y selección masiva. */
export const ShiftMembersPicker: React.FC<ShiftMembersPickerProps> = ({ members, isLoading, value, onChange }) => {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = members ?? [];
    return term
      ? list.filter((member) => member.nombre.toLowerCase().includes(term) || member.email.toLowerCase().includes(term))
      : list;
  }, [members, search]);
  const shown = visible.slice(0, MAX_VISIBLE);
  const allShownSelected = shown.length > 0 && shown.every((member) => value.includes(member.id));

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const toggleAll = () =>
    onChange(
      allShownSelected
        ? value.filter((id) => !shown.some((member) => member.id === id))
        : [...new Set([...value, ...shown.map((member) => member.id)])],
    );

  return (
    <View className="mb-4 gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-neutral">Equipo asignado</Text>
          <Text accessibilityLiveRegion="polite" className="text-xs text-primary font-bold">
            {value.length} {value.length === 1 ? 'persona seleccionada' : 'personas seleccionadas'}
          </Text>
        </View>
        {shown.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={toggleAll}
            className="min-h-11 justify-center active:opacity-70"
          >
            <Text className="text-sm font-bold text-primary">
              {allShownSelected ? 'Quitar a todos' : 'Seleccionar todos'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <TeamSearchBar value={search} onChangeText={setSearch} />

      {isLoading ? (
        <Text className="text-sm text-neutral-muted py-3">Cargando el equipo…</Text>
      ) : shown.length === 0 ? (
        <Text className="text-sm text-neutral-muted py-3">
          {search ? 'Ningún miembro coincide con la búsqueda.' : 'La organización aún no tiene miembros activos.'}
        </Text>
      ) : (
        <View style={{ borderCurve: 'continuous' }} className="rounded-2xl border border-borderBg overflow-hidden">
          {shown.map((member, index) => {
            const selected = value.includes(member.id);
            return (
              <Pressable
                key={member.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${member.nombre}, ${ROLE_NAME[member.rol]}`}
                onPress={() => toggle(member.id)}
                className={`min-h-14 flex-row items-center px-3 active:bg-tertiary ${index > 0 ? 'border-t border-borderBg' : ''} ${selected ? 'bg-inputBg' : ''}`}
              >
                <UserAvatar size={36} initials={getInitials(member.nombre)} uri={member.avatarUrl ?? undefined} />
                <View className="flex-1 mx-3">
                  <Text numberOfLines={1} className="text-sm font-bold text-neutral">
                    {member.nombre}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-neutral-muted">
                    {ROLE_NAME[member.rol]} · {member.email}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selected ? ThemeColors.primary : ThemeColors.mutedText}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {visible.length > MAX_VISIBLE ? (
        <Text className="text-xs text-neutral-muted">
          Mostrando {MAX_VISIBLE} de {visible.length}. Usa la búsqueda para encontrar a más personas.
        </Text>
      ) : null}
    </View>
  );
};
