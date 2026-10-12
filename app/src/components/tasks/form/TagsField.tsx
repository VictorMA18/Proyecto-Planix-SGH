import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { tagSchema } from '@/schemas/task.schema';

import { TagChip } from '../TagChip';
import { FieldError, FieldLabel } from './FieldLabel';

const MAX_TAGS = 5;

interface TagsFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

/** Etiquetas: chips con «×» y «+ Etiqueta» para escribir una nueva (máximo 5, sin repetir). */
export const TagsField: React.FC<TagsFieldProps> = ({ value, onChange, error }) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [inputError, setInputError] = useState('');

  const add = () => {
    const parsed = tagSchema.safeParse(text);
    if (!parsed.success) return setInputError(parsed.error.issues[0].message);
    if (value.some((tag) => tag.toLowerCase() === parsed.data.toLowerCase())) {
      return setInputError('Esa etiqueta ya está.');
    }
    onChange([...value, parsed.data]);
    setText('');
    setInputError('');
    setAdding(false);
  };

  return (
    <View>
      <FieldLabel icon="pricetag-outline" text="Etiquetas" />
      <View className="flex-row flex-wrap items-center gap-2">
        {value.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={() => onChange(value.filter((t) => t !== tag))} />
        ))}
        {!adding && value.length < MAX_TAGS ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir etiqueta"
            onPress={() => setAdding(true)}
            className="min-h-11 flex-row items-center rounded-lg border border-dashed border-primary/50 px-3 active:opacity-70"
          >
            <Ionicons name="add" size={16} color={ThemeColors.primary} />
            <Text className="ml-1 text-sm font-bold text-primary">Etiqueta</Text>
          </Pressable>
        ) : null}
      </View>

      {adding ? (
        <View className="flex-row items-center gap-2 mt-2">
          <TextInput
            accessibilityLabel="Nueva etiqueta"
            autoFocus
            style={{ fontFamily: 'DMSans_400Regular' }}
            className={`flex-1 h-11 bg-inputBg border rounded-xl px-3 text-sm text-neutral ${
              inputError ? 'border-red-500' : 'border-borderBg'
            }`}
            placeholder="Ej. Seguridad"
            placeholderTextColor={ThemeColors.mutedText}
            value={text}
            maxLength={24}
            onChangeText={(t) => {
              setText(t);
              if (inputError) setInputError('');
            }}
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar etiqueta"
            onPress={add}
            className="w-11 h-11 rounded-xl bg-primary items-center justify-center active:opacity-80"
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar etiqueta"
            onPress={() => {
              setAdding(false);
              setText('');
              setInputError('');
            }}
            className="w-11 h-11 rounded-xl bg-tertiary items-center justify-center active:opacity-80"
          >
            <Ionicons name="close" size={20} color={ThemeColors.primary} />
          </Pressable>
        </View>
      ) : null}
      <FieldError message={inputError || error} />
    </View>
  );
};
