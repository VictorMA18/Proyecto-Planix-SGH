import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton, AppInput } from '@/components/ui';
import { shiftFormSchema, type ShiftFormInput } from '@/schemas/attendance.schema';
import { useAssignableMembers } from '@/services/attendance';
import { formatHours, shiftHours } from '@/utils/attendance';

import { ShiftMembersPicker } from './ShiftMembersPicker';
import { WeekdayPicker } from './WeekdayPicker';

type FieldErrors = Partial<Record<keyof ShiftFormInput, string>>;

/** Escribe `0730` o `07:30`: inserta los dos puntos al llegar a la tercera cifra. */
function maskTime(text: string, previous: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return digits.length === 2 && text.length > previous.length ? `${digits}:` : digits;
}

interface ShiftFormProps {
  initial?: ShiftFormInput;
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (form: ShiftFormInput) => void;
  onCancel: () => void;
}

/** Formulario de una plantilla de turno (crear y editar), validado con Zod. */
export const ShiftForm: React.FC<ShiftFormProps> = ({ initial, submitLabel, isSaving, error, onSubmit, onCancel }) => {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [horaInicio, setHoraInicio] = useState(initial?.horaInicio ?? '');
  const [horaFin, setHoraFin] = useState(initial?.horaFin ?? '');
  const [dias, setDias] = useState<number[]>(initial?.dias ?? [1, 2, 3, 4, 5]);
  const [miembroIds, setMiembroIds] = useState<string[]>(initial?.miembroIds ?? []);
  const members = useAssignableMembers();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clear = (field: keyof ShiftFormInput) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const candidate = shiftFormSchema.safeParse({ nombre, horaInicio, horaFin, dias, miembroIds });
  const isDirty =
    !initial ||
    nombre.trim() !== initial.nombre ||
    horaInicio !== initial.horaInicio ||
    horaFin !== initial.horaFin ||
    dias.join() !== initial.dias.join() ||
    [...miembroIds].sort().join() !== [...initial.miembroIds].sort().join();

  const handleSubmit = () => {
    if (!candidate.success) {
      const errors: FieldErrors = {};
      candidate.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ShiftFormInput;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    onSubmit(candidate.data);
  };

  return (
    <View>
      {error ? (
        <View style={{ borderCurve: 'continuous' }} className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4">
          <Text className="text-red-800 text-sm font-medium">{error}</Text>
        </View>
      ) : null}

      <AppInput
        label="Nombre de la plantilla"
        leftIcon="albums-outline"
        placeholder="Ej. Turno Mañana Regular"
        value={nombre}
        maxLength={60}
        onChangeText={(text) => {
          setNombre(text);
          clear('nombre');
        }}
        error={fieldErrors.nombre}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppInput
            label="Hora de inicio"
            leftIcon="log-in-outline"
            placeholder="07:00"
            keyboardType="number-pad"
            maxLength={5}
            value={horaInicio}
            onChangeText={(text) => {
              setHoraInicio(maskTime(text, horaInicio));
              clear('horaInicio');
            }}
            error={fieldErrors.horaInicio}
          />
        </View>
        <View className="flex-1">
          <AppInput
            label="Hora de fin"
            leftIcon="log-out-outline"
            placeholder="15:30"
            keyboardType="number-pad"
            maxLength={5}
            value={horaFin}
            onChangeText={(text) => {
              setHoraFin(maskTime(text, horaFin));
              clear('horaFin');
            }}
            error={fieldErrors.horaFin}
          />
        </View>
      </View>

      {candidate.success ? (
        <Text accessibilityLiveRegion="polite" className="-mt-1 mb-4 text-xs font-semibold text-primary">
          Duración del turno: {formatHours(shiftHours(horaInicio, horaFin))}
        </Text>
      ) : null}

      <WeekdayPicker
        value={dias}
        onChange={(days) => {
          setDias(days);
          clear('dias');
        }}
        error={fieldErrors.dias}
      />

      <ShiftMembersPicker members={members.data} isLoading={members.isPending} value={miembroIds} onChange={setMiembroIds} />

      <View className="gap-3 mt-2">
        <AppButton title={submitLabel} icon="checkmark-outline" isLoading={isSaving} disabled={!isDirty} onPress={handleSubmit} />
        <AppButton title="Cancelar" variant="secondary" disabled={isSaving} onPress={onCancel} />
      </View>
    </View>
  );
};
