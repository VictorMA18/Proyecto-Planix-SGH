import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ConfirmModal, ProgressBar } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { subtaskTitleSchema, type TaskFormInput } from '@/schemas/task.schema';

import { subtasksSummary } from '../detail/SubtasksList';
import { TaskSection } from '../detail/TaskSection';
import { FieldError } from './FieldLabel';

type FormSubtask = TaskFormInput['subtareas'][number] & { key: string };

interface SubtasksEditorProps {
  value: FormSubtask[];
  onChange: (subtasks: FormSubtask[]) => void;
}

let keySequence = 0;
export const newSubtaskKey = () => `nueva-${++keySequence}`;

const IconButton: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }> = ({
  icon,
  label,
  color,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    className="w-11 h-11 rounded-xl items-center justify-center active:bg-tertiary"
  >
    <Ionicons name={icon} size={18} color={color} />
  </Pressable>
);

/** Subtareas editables: marcar, renombrar, eliminar (con confirmación) y añadir nuevas. */
export const SubtasksEditor: React.FC<SubtasksEditorProps> = ({ value, onChange }) => {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [editing, setEditing] = useState<{ key: string; text: string; error: string } | null>(null);
  const [removing, setRemoving] = useState<FormSubtask | null>(null);
  const summary = subtasksSummary(value);

  const add = () => {
    const parsed = subtaskTitleSchema.safeParse(draft);
    if (!parsed.success) return setDraftError(parsed.error.issues[0].message);
    onChange([...value, { key: newSubtaskKey(), titulo: parsed.data, completada: false }]);
    setDraft('');
    setDraftError('');
  };

  const saveEdit = () => {
    if (!editing) return;
    const parsed = subtaskTitleSchema.safeParse(editing.text);
    if (!parsed.success) return setEditing({ ...editing, error: parsed.error.issues[0].message });
    onChange(value.map((st) => (st.key === editing.key ? { ...st, titulo: parsed.data } : st)));
    setEditing(null);
  };

  return (
    <TaskSection icon="list-outline" title="Subtareas" trailing={value.length ? summary.label : undefined}>
      {value.length > 0 ? <ProgressBar value={summary.percent} color={ThemeColors.primary} /> : null}

      <View className="gap-1">
        {value.map((subtask) =>
          editing?.key === subtask.key ? (
            <View key={subtask.key}>
              <View className="flex-row items-center gap-1">
                <TextInput
                  accessibilityLabel="Editar subtarea"
                  autoFocus
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className={`flex-1 h-11 bg-inputBg border rounded-xl px-3 text-sm text-neutral ${
                    editing.error ? 'border-red-500' : 'border-primary/40'
                  }`}
                  value={editing.text}
                  maxLength={120}
                  onChangeText={(text) => setEditing({ ...editing, text, error: '' })}
                  onSubmitEditing={saveEdit}
                  returnKeyType="done"
                />
                <IconButton icon="checkmark" label="Guardar subtarea" color={ThemeColors.primary} onPress={saveEdit} />
                <IconButton icon="close" label="Cancelar edición" color={ThemeColors.mutedText} onPress={() => setEditing(null)} />
              </View>
              <FieldError message={editing.error} />
            </View>
          ) : (
            <View key={subtask.key} className="flex-row items-center">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: subtask.completada }}
                accessibilityLabel={subtask.titulo}
                onPress={() =>
                  onChange(value.map((st) => (st.key === subtask.key ? { ...st, completada: !st.completada } : st)))
                }
                className="flex-1 min-h-11 flex-row items-center active:opacity-70"
              >
                <Ionicons
                  name={subtask.completada ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={subtask.completada ? ThemeColors.primary : ThemeColors.mutedText}
                />
                <Text
                  className={`flex-1 ml-3 text-sm ${subtask.completada ? 'text-neutral-muted line-through' : 'font-medium text-neutral'}`}
                >
                  {subtask.titulo}
                </Text>
              </Pressable>
              <IconButton
                icon="create-outline"
                label={`Editar «${subtask.titulo}»`}
                color={ThemeColors.mutedText}
                onPress={() => setEditing({ key: subtask.key, text: subtask.titulo, error: '' })}
              />
              <IconButton
                icon="trash-outline"
                label={`Eliminar «${subtask.titulo}»`}
                color={ThemeStatus.errorText}
                onPress={() => setRemoving(subtask)}
              />
            </View>
          ),
        )}
      </View>

      <View>
        <View className="flex-row items-center gap-2">
          <TextInput
            accessibilityLabel="Nueva subtarea"
            style={{ fontFamily: 'DMSans_400Regular' }}
            className={`flex-1 h-11 bg-inputBg border rounded-xl px-3 text-sm text-neutral ${draftError ? 'border-red-500' : 'border-borderBg'}`}
            placeholder="Nueva subtarea…"
            placeholderTextColor={ThemeColors.mutedText}
            value={draft}
            maxLength={120}
            onChangeText={(text) => {
              setDraft(text);
              if (draftError) setDraftError('');
            }}
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir subtarea"
            onPress={add}
            className="min-h-11 flex-row items-center bg-primary rounded-xl px-4 active:opacity-80"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="ml-1 text-sm font-bold text-white">Añadir</Text>
          </Pressable>
        </View>
        <FieldError message={draftError} />
      </View>

      <ConfirmModal
        visible={!!removing}
        destructive
        icon="trash-outline"
        title="¿Eliminar esta subtarea?"
        message={removing ? `«${removing.titulo}» se quitará de la tarea al guardar los cambios.` : undefined}
        confirmLabel="Sí, eliminar"
        onConfirm={() => {
          if (removing) onChange(value.filter((st) => st.key !== removing.key));
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </TaskSection>
  );
};
