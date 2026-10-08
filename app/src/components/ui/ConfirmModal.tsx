import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';

import { AppButton } from './AppButton';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Acción destructiva: icono y botón de confirmar en rojo. */
  destructive?: boolean;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  /** Error devuelto al confirmar (p. ej. un 409 del backend). */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Contenido extra entre el mensaje y los botones (p. ej. un selector de rol). */
  children?: React.ReactNode;
}

/** Diálogo centrado para pedir confirmación antes de una acción que no se puede deshacer a la ligera. */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon = 'help-circle-outline',
  destructive = false,
  isLoading = false,
  confirmDisabled = false,
  error,
  onConfirm,
  onCancel,
  children,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={isLoading ? undefined : onCancel}
  >
    <View className="flex-1 items-center justify-center px-5">
      <Pressable
        accessibilityLabel="Cerrar"
        disabled={isLoading}
        onPress={onCancel}
        className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
      />

      <View
        accessibilityViewIsModal
        style={{ borderCurve: 'continuous' }}
        className="w-full max-w-[420px] bg-cardBg rounded-3xl p-6"
      >
        <View className="items-center">
          <View
            style={{ backgroundColor: destructive ? ThemeStatus.errorBg : ThemeColors.tertiary }}
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
          >
            <Ionicons
              name={icon}
              size={28}
              color={destructive ? ThemeStatus.errorText : ThemeColors.primary}
            />
          </View>
          <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral text-center">
            {title}
          </Text>
          {message ? (
            <Text className="text-sm text-neutral-muted text-center mt-2">{message}</Text>
          ) : null}
        </View>

        {children ? <View className="mt-5">{children}</View> : null}

        {error ? (
          <View
            accessibilityRole="alert"
            style={{ borderCurve: 'continuous' }}
            className="bg-red-100 border border-red-500 rounded-2xl p-3.5 mt-4"
          >
            <Text className="text-red-800 text-sm font-medium">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3 mt-6">
          <AppButton
            title={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            isLoading={isLoading}
            disabled={confirmDisabled}
          />
          <AppButton title={cancelLabel} variant="secondary" onPress={onCancel} disabled={isLoading} />
        </View>
      </View>
    </View>
  </Modal>
);
