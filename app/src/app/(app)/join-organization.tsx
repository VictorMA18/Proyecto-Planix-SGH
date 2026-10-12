import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton, AppInput, FormScreenLayout } from '@/components/ui';
import { joinOrganizationSchema } from '@/schemas/organization.schema';
import { useAcceptInvitation } from '@/services/organizations';
import { useGoBack } from '@/hooks/use-go-back';

export default function JoinOrganizationScreen() {
  const router = useRouter();
  const goBack = useGoBack('/');
  const acceptInvitation = useAcceptInvitation();

  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = async () => {
    setErrorMessage('');
    setFieldError('');

    const result = joinOrganizationSchema.safeParse({ code });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Código inválido.');
      return;
    }

    try {
      await acceptInvitation.mutateAsync(result.data.code);
      goBack();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo aceptar la invitación.');
    }
  };

  return (
    <FormScreenLayout title="Unirme con código">
      <Text className="text-sm text-neutral-muted mb-5">
        Ingresa el código que te compartió el administrador de la organización. Debe haberse
        emitido para el correo de tu cuenta.
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
        label="Código de invitación"
        requiredText="Obligatorio"
        leftIcon="key-outline"
        placeholder="Ej. K7M2Q9XPTA"
        value={code}
        onChangeText={(text) => {
          setCode(text);
          if (fieldError) setFieldError('');
        }}
        error={fieldError}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={32}
      />

      <View className="mt-2">
        <AppButton
          title="Unirme a la organización"
          icon="log-in-outline"
          onPress={handleJoin}
          isLoading={acceptInvitation.isPending}
        />
      </View>
      <View className="mt-3">
        <AppButton
          title="Cancelar"
          variant="secondary"
          onPress={() => goBack()}
          disabled={acceptInvitation.isPending}
        />
      </View>
    </FormScreenLayout>
  );
}
