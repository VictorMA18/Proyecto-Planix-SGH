import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton, AppInput, FormScreenLayout } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { PASSWORD_MIN_LENGTH } from '@/schemas/auth.schema';
import { changePasswordSchema, type ChangePasswordInput } from '@/schemas/profile.schema';

type FieldErrors = Partial<Record<keyof ChangePasswordInput, string>>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Las cuentas creadas solo con Google no tienen contraseña que cambiar.
  if (isLoaded && user && !user.passwordEnabled) {
    return <Redirect href="/profile" />;
  }

  const handleChange =
    (field: keyof ChangePasswordInput, setter: (value: string) => void) => (text: string) => {
      setter(text);
      if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSave = async () => {
    if (!user) return;
    setErrorMessage('');
    setFieldErrors({});

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ChangePasswordInput;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await user.updatePassword({
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
        signOutOfOtherSessions: signOutOthers,
      });
      setIsDone(true);
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage || err?.message || 'No se pudo cambiar la contraseña.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isDone) {
    return (
      <FormScreenLayout title="Cambiar contraseña">
        <View className="items-center py-2">
          <View
            style={{ backgroundColor: ThemeStatus.successBg }}
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
          >
            <Ionicons name="checkmark-circle" size={36} color={ThemeStatus.success} />
          </View>
          <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral mb-1">
            Contraseña actualizada
          </Text>
          <Text className="text-sm text-neutral-muted text-center mb-6">
            Usa tu nueva contraseña la próxima vez que inicies sesión.
          </Text>
          <AppButton title="Volver a mi cuenta" onPress={() => router.back()} />
        </View>
      </FormScreenLayout>
    );
  }

  const toggleIcon = showPassword ? 'eye-off-outline' : 'eye-outline';

  return (
    <FormScreenLayout title="Cambiar contraseña">
      <Text className="text-sm text-neutral-muted mb-5">
        Cambia la contraseña con la que accedes a PLANYX. Debe tener al menos {PASSWORD_MIN_LENGTH}{' '}
        caracteres.
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
        label="Contraseña actual"
        requiredText="Obligatorio"
        leftIcon="lock-closed-outline"
        rightIcon={toggleIcon}
        onRightIconPress={() => setShowPassword(!showPassword)}
        placeholder="••••••••"
        value={currentPassword}
        onChangeText={handleChange('currentPassword', setCurrentPassword)}
        error={fieldErrors.currentPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="password"
      />

      <AppInput
        label="Nueva contraseña"
        requiredText={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
        leftIcon="key-outline"
        placeholder="Crea una contraseña segura"
        value={newPassword}
        onChangeText={handleChange('newPassword', setNewPassword)}
        error={fieldErrors.newPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="newPassword"
      />

      <AppInput
        label="Confirmar nueva contraseña"
        leftIcon="sync-outline"
        placeholder="Repite la nueva contraseña"
        value={confirmPassword}
        onChangeText={handleChange('confirmPassword', setConfirmPassword)}
        error={fieldErrors.confirmPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="newPassword"
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: signOutOthers }}
        accessibilityLabel="Cerrar sesión en otros dispositivos"
        className="flex-row items-center p-1 mb-6"
        onPress={() => setSignOutOthers(!signOutOthers)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View
          className={`w-5 h-5 rounded-md border border-neutral-muted mr-2.5 justify-center items-center ${
            signOutOthers ? 'bg-primary border-primary' : ''
          }`}
        >
          {signOutOthers ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </View>
        <Text className="flex-1 text-sm font-medium text-neutral">
          Cerrar sesión en otros dispositivos
        </Text>
      </Pressable>

      <AppButton
        title="Cambiar contraseña"
        icon="shield-checkmark-outline"
        onPress={handleSave}
        isLoading={isSaving}
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
