import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { TeamSearchBar } from '@/components/team/TeamSearchBar';
import { UserAvatar } from '@/components/ui';
import { ROLE_NAME } from '@/constants/roles';
import { ThemeColors } from '@/constants/theme';
import type { TeamMember } from '@/schemas/team.schema';
import { getInitials } from '@/utils/format';

interface BroadcastRecipientsProps {
  members: TeamMember[] | undefined;
  isLoading: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Lista de miembros activos con búsqueda para elegir quién recibe el aviso. «Seleccionar todos»
 * actúa sobre lo que coincide con la búsqueda.
 */
export const BroadcastRecipients: React.FC<BroadcastRecipientsProps> = ({ members, isLoading, value, onChange }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (members ?? []).filter(
      (m) =>
        !term ||
        m.nombre.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        ROLE_NAME[m.rol].toLowerCase().includes(term),
    );
  }, [members, search]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((m) => value.includes(m.id));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const toggleVisible = () => {
    const visible = new Set(filtered.map((m) => m.id));
    onChange(
      allVisibleSelected ? value.filter((id) => !visible.has(id)) : [...new Set([...value, ...visible])],
    );
  };

  return (
    <View className="gap-3">
      <TeamSearchBar value={search} onChangeText={setSearch} />

      <View className="flex-row items-center justify-between">
        <Text accessibilityLiveRegion="polite" className="text-xs font-bold text-neutral-muted">
          {value.length} {value.length === 1 ? 'seleccionado' : 'seleccionados'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={allVisibleSelected ? 'Quitar todos los de la lista' : 'Seleccionar todos los de la lista'}
          disabled={filtered.length === 0}
          onPress={toggleVisible}
          hitSlop={8}
          className="min-h-11 justify-center active:opacity-70"
        >
          <Text className="text-sm font-bold text-primary">
            {allVisibleSelected ? 'Quitar todos' : 'Seleccionar todos'}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={ThemeColors.primary} style={{ marginVertical: 16 }} />
      ) : filtered.length === 0 ? (
        <Text className="py-4 text-center text-sm text-neutral-muted">Ningún miembro coincide con la búsqueda.</Text>
      ) : (
        <View className="gap-1">
          {filtered.map((member) => {
            const selected = value.includes(member.id);
            return (
              <Pressable
                key={member.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${member.nombre}, ${ROLE_NAME[member.rol]}`}
                onPress={() => toggle(member.id)}
                className="active:opacity-75"
              >
                {/* Fondo y radio en `style`, nunca transparente, y `key` para remontar: así Android
                    no pierde el redondeado al seleccionar. */}
                <View
                  key={selected ? 'on' : 'off'}
                  style={{
                    borderCurve: 'continuous',
                    borderRadius: 16,
                    backgroundColor: selected ? ThemeColors.tertiary : ThemeColors.cardBg,
                  }}
                  className="min-h-14 flex-row items-center px-3"
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
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};
