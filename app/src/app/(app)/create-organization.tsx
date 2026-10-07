import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton, AppInput, FormScreenLayout } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { createOrganizationSchema } from '@/schemas/organization.schema';
import { useCreateOrganization } from '@/services/organizations';
import { useOrganizationStore } from '@/stores/useOrganizationStore';
import { formatTimeZone } from '@/utils/format';

const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima';

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const createOrganization = useCreateOrganization();
  const setActiveOrganization = useOrganizationStore((state) => state.setActiveOrganization);

  const [nombre, setNombre] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreate = async () => {
    setErrorMessage('');
    setFieldError('');

    const result = createOrganizationSchema.safeParse({ nombre });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Nombre inválido.');
      return;
    }

    try {
      const organization = await createOrganization.mutateAsync({
        nombre: result.data.nombre,
        zonaHoraria: deviceTimeZone,
      });
      setActiveOrganization(organization.id);
      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo crear la organización.');
    }
  };

  return (
    <FormScreenLayout title="Nueva organización">
      <Text className="text-sm text-neutral-muted mb-5">
        Serás el administrador de la organización y podrás invitar a tu equipo.
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
        label="Nombre de la organización"
        requiredText="Obligatorio"
        leftIcon="business-outline"
        placeholder="Ej. Acme Corp Central"
        value={nombre}
        onChangeText={(text) => {
          setNombre(text);
          if (fieldError) setFieldError('');
        }}
        error={fieldError}
        autoCapitalize="words"
      />

      <View
        style={{ borderCurve: 'continuous' }}
        className="flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 mb-6"
      >
        <Ionicons name="time-outline" size={18} color={ThemeColors.mutedText} />
        <View className="flex-1 ml-3">
          <Text className="text-[11px] text-neutral-muted">Zona horaria (de tu dispositivo)</Text>
          <Text numberOfLines={1} className="text-sm font-bold text-neutral">
            {formatTimeZone(deviceTimeZone)}
          </Text>
        </View>
      </View>

      <AppButton
        title="Crear organización"
        icon="add-circle-outline"
        onPress={handleCreate}
        isLoading={createOrganization.isPending}
      />
      <View className="mt-3">
        <AppButton
          title="Cancelar"
          variant="secondary"
          onPress={() => router.back()}
          disabled={createOrganization.isPending}
        />
      </View>
    </FormScreenLayout>
  );
}
