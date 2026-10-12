import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppInput, ChoiceChips, ConfirmModal } from '@/components/ui';
import { TASK_PRIORITY } from '@/constants/tasks';
import { ThemeStatus } from '@/constants/theme';
import { taskFormSchema, taskPrioritySchema, type TaskFormInput } from '@/schemas/task.schema';
import { useTaskMembers } from '@/services/tasks';
import { maskTime } from '@/utils/format';

import { TaskStatusStepper } from '../detail/TaskStatusStepper';
import { AssigneesField } from './AssigneesField';
import { AttachmentsEditor } from './AttachmentsEditor';
import { DateField } from './DateField';
import { DescriptionEditor } from './DescriptionEditor';
import { newSubtaskKey, SubtasksEditor } from './SubtasksEditor';
import { TagsField } from './TagsField';

type FieldErrors = Partial<Record<keyof TaskFormInput, string>>;
type FormState = Omit<TaskFormInput, 'subtareas'> & {
  subtareas: (TaskFormInput['subtareas'][number] & { key: string })[];
};

interface TaskFormProps {
  initial: TaskFormInput;
  mode: 'create' | 'edit';
  isSaving: boolean;
  error?: string;
  onSubmit: (form: TaskFormInput) => void;
  onCancel: () => void;
  /** Solo al editar: eliminar la tarea (pide confirmación). */
  onDelete?: () => void;
  isDeleting?: boolean;
}

const withKeys = (form: TaskFormInput): FormState => ({
  ...form,
  subtareas: form.subtareas.map((st) => ({ ...st, key: st.id ?? newSubtaskKey() })),
});

/** Formulario de crear y editar una tarea (ADMIN y SUPERVISOR), validado con Zod. */
export const TaskForm: React.FC<TaskFormProps> = ({
  initial,
  mode,
  isSaving,
  error,
  onSubmit,
  onCancel,
  onDelete,
  isDeleting,
}) => {
  const insets = useSafeAreaInsets();
  const members = useTaskMembers();
  const start = useMemo(() => withKeys(initial), [initial]);
  const [form, setForm] = useState<FormState>(start);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirm, setConfirm] = useState<'discard' | 'delete' | null>(null);

  const strip = (state: FormState): TaskFormInput => ({
    ...state,
    subtareas: state.subtareas.map(({ key: _key, ...st }) => st),
  });
  const dirty = JSON.stringify(strip(form)) !== JSON.stringify(strip(start));

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof TaskFormInput]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = () => {
    const parsed = taskFormSchema.safeParse(strip(form));
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof TaskFormInput;
        if (field && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }
    onSubmit(parsed.data);
  };

  const cancel = () => (dirty ? setConfirm('discard') : onCancel());
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[480px] self-center px-5 gap-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        {error || hasErrors ? (
          <View
            accessibilityRole="alert"
            style={{ backgroundColor: ThemeStatus.errorBg, borderCurve: 'continuous' }}
            className="rounded-2xl p-3.5"
          >
            <Text style={{ color: ThemeStatus.errorText }} className="text-sm font-medium">
              {error || 'Revisa los campos marcados en rojo.'}
            </Text>
          </View>
        ) : null}

        <View>
          <AppInput
            label="Título de la tarea"
            requiredText="requerido"
            leftIcon="create-outline"
            placeholder="Ej. Inspección de sistemas de acceso"
            value={form.titulo}
            maxLength={200}
            onChangeText={(text) => set('titulo', text)}
            error={errors.titulo}
          />
          <TaskStatusStepper value={form.estado} onChange={(estado) => set('estado', estado)} />
        </View>

        <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10 gap-4">
          <AssigneesField
            members={members.data}
            isLoading={members.isPending}
            value={form.miembroIds}
            onChange={(ids) => set('miembroIds', ids)}
            error={errors.miembroIds}
          />

          <View className="pt-4 border-t border-borderBg">
            <ChoiceChips
              label="Prioridad"
              value={form.prioridad}
              onChange={(prioridad) => set('prioridad', prioridad)}
              options={taskPrioritySchema.options.map((p) => ({
                value: p,
                label: TASK_PRIORITY[p].short,
                accent: TASK_PRIORITY[p].color,
              }))}
            />
            <DateField value={form.fecha} onChange={(fecha) => set('fecha', fecha)} error={errors.fecha} />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <AppInput
                label="Hora de inicio"
                leftIcon="time-outline"
                placeholder="09:00"
                keyboardType="number-pad"
                maxLength={5}
                value={form.horaInicio}
                onChangeText={(text) => set('horaInicio', maskTime(text, form.horaInicio))}
                error={errors.horaInicio}
              />
            </View>
            <View className="flex-1">
              <AppInput
                label="Hora de fin"
                requiredText="opcional"
                leftIcon="flag-outline"
                placeholder="11:00"
                keyboardType="number-pad"
                maxLength={5}
                value={form.horaFin}
                onChangeText={(text) => set('horaFin', maskTime(text, form.horaFin))}
                error={errors.horaFin}
              />
            </View>
          </View>

          <AppInput
            label="Ubicación"
            requiredText="opcional"
            leftIcon="location-outline"
            placeholder="Ej. Torno Norte"
            value={form.ubicacion}
            maxLength={120}
            onChangeText={(text) => set('ubicacion', text)}
            error={errors.ubicacion}
          />

          <View className="pt-4 border-t border-borderBg">
            <TagsField value={form.etiquetas} onChange={(tags) => set('etiquetas', tags)} error={errors.etiquetas} />
          </View>
        </View>

        <DescriptionEditor value={form.descripcion} onChange={(text) => set('descripcion', text)} error={errors.descripcion} />
        <SubtasksEditor value={form.subtareas} onChange={(subtareas) => set('subtareas', subtareas)} />
        <AttachmentsEditor value={form.adjuntos} onChange={(adjuntos) => set('adjuntos', adjuntos)} />
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="w-full bg-cardBg border-t border-borderBg px-5 pt-3"
      >
        <View className="w-full max-w-[480px] self-center flex-row items-center gap-2">
          <View className="flex-1">
            <AppButton
              title={mode === 'create' ? 'Crear tarea' : 'Guardar cambios'}
              icon="save-outline"
              isLoading={isSaving}
              disabled={mode === 'edit' && !dirty}
              onPress={submit}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={cancel}
            style={{ borderCurve: 'continuous' }}
            className="min-h-12 justify-center bg-tertiary rounded-2xl px-4 active:opacity-80"
          >
            <Text className="text-sm font-bold text-neutral">Cancelar</Text>
          </Pressable>
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar tarea"
              onPress={() => setConfirm('delete')}
              style={{ backgroundColor: ThemeStatus.errorBg, borderCurve: 'continuous' }}
              className="w-12 h-12 rounded-2xl items-center justify-center active:opacity-80"
            >
              <Ionicons name="trash-outline" size={20} color={ThemeStatus.errorText} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ConfirmModal
        visible={confirm === 'discard'}
        icon="alert-circle-outline"
        title="¿Descartar los cambios?"
        message="Tienes cambios sin guardar. Si sales ahora, se perderán."
        confirmLabel="Sí, descartar"
        cancelLabel="Seguir editando"
        destructive
        onConfirm={() => {
          setConfirm(null);
          onCancel();
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        visible={confirm === 'delete'}
        icon="trash-outline"
        title={`¿Eliminar «${initial.titulo}»?`}
        message="Se borrarán la tarea, sus subtareas, comentarios y actividad. No se puede deshacer."
        confirmLabel="Sí, eliminar tarea"
        destructive
        isLoading={isDeleting}
        onConfirm={() => {
          setConfirm(null);
          onDelete?.();
        }}
        onCancel={() => setConfirm(null)}
      />
    </KeyboardAvoidingView>
  );
};
