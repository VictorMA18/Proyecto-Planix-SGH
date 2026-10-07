import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton, AppInput, FormScreenLayout } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/profile.schema';

type FieldErrors = Partial<Record<keyof UpdateProfileInput, string>>;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    firstName.trim() !== (user?.firstName ?? '') || lastName.trim() !== (user?.lastName ?? '');

  const handleChange = (field: keyof UpdateProfileInput, setter: (value: string) => void) => (
    text: string
  ) => {
    setter(text);
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    if (!user) return;
    setErrorMessage('');
    setFieldErrors({});

    const result = updateProfileSchema.safeParse({ firstName, lastName });
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UpdateProfileInput;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await user.update({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      });
      router.back();
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || err?.message || 'No se pudieron guardar los cambios.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormScreenLayout title="Editar datos">
      <Text className="text-sm text-neutral-muted mb-5">
        Actualiza cómo apareces ante tus organizaciones. Los cambios se guardan en tu cuenta.
      </Text>

      {errorMessage ? (
        <View
          style={{ borderCurve: 'continuous' }}
          className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4"
        >
          <Text className="text-red-800 text-sm font-medium">{errorMessage}</Text>
        </View>
      ) : null}

      <AppInput
        label="Nombre"
        requiredText="Obligatorio"
        leftIcon="person-outline"
        placeholder="Ej. Carlos"
        value={firstName}
        onChangeText={handleChange('firstName', setFirstName)}
        error={fieldErrors.firstName}
        autoCapitalize="words"
        textContentType="givenName"
      />

      <AppInput
        label="Apellidos"
        requiredText="Obligatorio"
        leftIcon="person-outline"
        placeholder="Ej. Méndez"
        value={lastName}
        onChangeText={handleChange('lastName', setLastName)}
        error={fieldErrors.lastName}
        autoCapitalize="words"
        textContentType="familyName"
      />

      <View
        style={{ borderCurve: 'continuous' }}
        className="flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 mb-6"
      >
        <Ionicons name="mail-outline" size={18} color={ThemeColors.mutedText} />
        <View className="flex-1 ml-3">
          <Text className="text-[11px] text-neutral-muted">Correo de la cuenta</Text>
          <Text numberOfLines={1} className="text-sm font-bold text-neutral">
            {user?.primaryEmailAddress?.emailAddress ?? '—'}
          </Text>
        </View>
        <Ionicons name="lock-closed-outline" size={16} color={ThemeColors.mutedText} />
      </View>

      <AppButton
        title="Guardar cambios"
        icon="checkmark-circle-outline"
        onPress={handleSave}
        isLoading={isSaving}
        disabled={!isDirty}
      />
      <View className="mt-3">
        <AppButton
          title="Cancelar"
          variant="secondary"
          onPress={() => router.back()}
          disabled={isSaving}
        />
      </View>
    </FormScreenLayout>
  );
}
