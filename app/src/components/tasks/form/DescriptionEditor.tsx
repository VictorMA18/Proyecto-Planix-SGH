import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

import { TaskSection } from '../detail/TaskSection';
import { FieldError } from './FieldLabel';

type Format = 'bold' | 'italic' | 'list' | 'link';

const TOOLS: { format: Format; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { format: 'bold', icon: 'text', label: 'Negrita' },
  { format: 'italic', icon: 'text-outline', label: 'Cursiva' },
  { format: 'list', icon: 'list', label: 'Lista' },
  { format: 'link', icon: 'link', label: 'Enlace' },
];

/** Aplica un formato Markdown a la selección (o inserta un ejemplo si no hay selección). */
function applyFormat(text: string, start: number, end: number, format: Format): string {
  const selected = text.slice(start, end);
  const wrap = (left: string, right: string, fallback: string) => {
    const inner = selected || fallback;
    return text.slice(0, start) + left + inner + right + text.slice(end);
  };
  if (format === 'bold') return wrap('**', '**', 'texto');
  if (format === 'italic') return wrap('_', '_', 'texto');
  if (format === 'link') return wrap('[', '](https://)', selected || 'enlace');
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const prefix = lineStart === start && start === text.length && text.length > 0 && !text.endsWith('\n') ? '\n- ' : '- ';
  return text.slice(0, lineStart) + prefix + text.slice(lineStart);
}

interface DescriptionEditorProps {
  value: string;
  onChange: (text: string) => void;
  error?: string;
}

/** Descripción con una barra simple que escribe Markdown (negrita, cursiva, listas y enlaces). */
export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, error }) => {
  // Solo se lee la selección: controlarla hace saltar el cursor en Android.
  const [selection, setSelection] = useState({ start: value.length, end: value.length });

  return (
    <TaskSection icon="create-outline" title="Descripción" trailing={<Text className="text-[11px] text-neutral-muted">Markdown habilitado</Text>}>
      <View className="flex-row gap-1">
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.format}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
            onPress={() => {
              onChange(applyFormat(value, selection.start, selection.end, tool.format));
            }}
            className="w-11 h-11 rounded-xl items-center justify-center active:bg-tertiary"
          >
            {tool.format === 'bold' ? (
              <Text className="text-base font-extrabold text-neutral">B</Text>
            ) : tool.format === 'italic' ? (
              <Text className="text-base italic font-semibold text-neutral">I</Text>
            ) : (
              <Ionicons name={tool.icon} size={18} color={ThemeColors.neutral} />
            )}
          </Pressable>
        ))}
      </View>
      <TextInput
        accessibilityLabel="Descripción de la tarea"
        multiline
        textAlignVertical="top"
        style={{ fontFamily: 'DMSans_400Regular', minHeight: 120 }}
        className={`bg-inputBg border rounded-2xl p-4 text-sm leading-6 text-neutral ${error ? 'border-red-500' : 'border-borderBg'}`}
        placeholder="Explica qué hay que hacer, con el detalle necesario…"
        placeholderTextColor={ThemeColors.mutedText}
        value={value}
        maxLength={2000}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        onChangeText={onChange}
      />
      <FieldError message={error} />
    </TaskSection>
  );
};
