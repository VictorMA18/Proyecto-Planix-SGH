import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppInput, ChoiceChips, SegmentedControl } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import {
  genericCodeSchema,
  personalInviteSchema,
  DEFAULT_VIGENCIA_MINUTOS,
  VIGENCIA_OPTIONS,
  type InvitationCode,
  type InviteRole,
} from '@/schemas/team.schema';
import { useCreateGenericCode, useCreatePersonalInvite } from '@/services/team';

import { RolePicker } from './RolePicker';

export interface GeneratedInvite {
  code: InvitationCode;
  /** Solo en invitaciones personales: el correo al que pertenece el código. */
  email?: string;
}

type Mode = 'personal' | 'generic';
type FieldErrors = { email?: string; rol?: string; vigenciaMinutos?: string };

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  issues.forEach((issue) => {
    const field = issue.path[0] as keyof FieldErrors;
    if (field && !errors[field]) errors[field] = issue.message;
  });
  return errors;
}

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerated: (invite: GeneratedInvite) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
  onGenerated,
}) => {
  const insets = useSafeAreaInsets();
  const personalInvite = useCreatePersonalInvite();
  const genericCode = useCreateGenericCode();

  const [mode, setMode] = useState<Mode>('personal');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole | undefined>(undefined);
  const [vigencia, setVigencia] = useState<number | undefined>(DEFAULT_VIGENCIA_MINUTOS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState('');

  // Teclado: la hoja sube lo que el teclado la tapa, y el campo enfocado se lleva a la vista.
  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const emailFieldY = useRef(0);
  const [rootHeight, setRootHeight] = useState(0);
  const keyboardOverlap = useKeyboardOverlap(rootRef);
  const keyboardOpen = keyboardOverlap > 0;

  const isLoading = personalInvite.isPending || genericCode.isPending;

  // Cada vez que se abre, el formulario empieza limpio.
  useEffect(() => {
    if (!visible) return;
    setMode('personal');
    setEmail('');
    setRole(undefined);
    setVigencia(DEFAULT_VIGENCIA_MINUTOS);
    setFieldErrors({});
    setErrorMessage('');
  }, [visible]);

  const clearError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async () => {
    setErrorMessage('');
    setFieldErrors({});

    try {
      if (mode === 'personal') {
        const result = personalInviteSchema.safeParse({ email, rol: role });
        if (!result.success) {
          setFieldErrors(toFieldErrors(result.error.issues));
          return;
        }
        const code = await personalInvite.mutateAsync(result.data);
        onGenerated({ code, email: result.data.email });
      } else {
        const result = genericCodeSchema.safeParse({ rol: role, vigenciaMinutos: vigencia });
        if (!result.success) {
          setFieldErrors(toFieldErrors(result.error.issues));
          return;
        }
        onGenerated({ code: await genericCode.mutateAsync(result.data) });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo generar el código.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        ref={rootRef}
        onLayout={(event) => setRootHeight(event.nativeEvent.layout.height)}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{
            borderCurve: 'continuous',
            // Con el teclado abierto la hoja queda sobre él, con aire de sobra entre ambos.
            marginBottom: keyboardOverlap,
            paddingBottom: keyboardOpen ? 24 : Math.max(insets.bottom, 0) + 24,
            maxHeight:
              rootHeight > 0 ? rootHeight - keyboardOverlap - Math.max(insets.top, 0) - 16 : undefined,
          }}
          className="w-full max-w-[480px] self-center bg-cardBg rounded-t-3xl px-6 pt-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text accessibilityRole="header" className="flex-1 text-xl font-extrabold text-neutral">
              Invitar nuevo miembro
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              className="w-11 h-11 -mr-2 items-center justify-center"
            >
              <Ionicons name="close" size={22} color={ThemeColors.neutral} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SegmentedControl
              value={mode}
              onChange={(next) => {
                setMode(next);
                setFieldErrors({});
                setErrorMessage('');
              }}
              options={[
                { value: 'personal', label: 'Personal' },
                { value: 'generic', label: 'Código genérico' },
              ]}
            />

            <Text className="text-sm text-neutral-muted mb-4">
              {mode === 'personal'
                ? 'Genera un código para una persona concreta. Solo podrá usarlo la cuenta con ese correo.'
                : 'Genera un código para cualquier persona. Quien lo use entrará con el rol que elijas.'}
            </Text>

            {errorMessage ? (
              <View
                style={{ borderCurve: 'continuous' }}
                className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mb-4"
              >
                <Text className="text-red-800 text-sm font-medium">{errorMessage}</Text>
              </View>
            ) : null}

            {mode === 'personal' ? (
              <View onLayout={(event) => (emailFieldY.current = event.nativeEvent.layout.y)}>
                <AppInput
                  label="Correo de la cuenta a invitar"
                  requiredText="Obligatorio"
                  leftIcon="mail-outline"
                  placeholder="persona@empresa.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError('email');
                  }}
                  error={fieldErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  // Deja el campo cerca de la parte alta, bien separado del teclado.
                  onFocus={() =>
                    scrollRef.current?.scrollTo({ y: Math.max(0, emailFieldY.current - 16), animated: true })
                  }
                />
              </View>
            ) : null}

            <RolePicker
              value={role}
              onChange={(next) => {
                setRole(next);
                clearError('rol');
              }}
              error={fieldErrors.rol}
            />

            {mode === 'generic' ? (
              <ChoiceChips
                label="Vigencia del código"
                value={vigencia}
                onChange={(next) => {
                  setVigencia(next);
                  clearError('vigenciaMinutos');
                }}
                error={fieldErrors.vigenciaMinutos}
                options={VIGENCIA_OPTIONS.map((minutes) => ({ value: minutes, label: `${minutes} minutos` }))}
              />
            ) : null}

            <View className="mt-2">
              <AppButton
                title="Generar código"
                icon="key-outline"
                onPress={handleSubmit}
                isLoading={isLoading}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
