import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';

interface MembershipsStateProps {
  status: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
  /** Textos propios para listas distintas de las organizaciones. */
  loadingText?: string;
  errorTitle?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
}

/** Estados sin datos de las listas de organizaciones: cargando, error y vacío. */
export const MembershipsState: React.FC<MembershipsStateProps> = ({
  status,
  message,
  onRetry,
  loadingText = 'Cargando tus organizaciones…',
  errorTitle = 'No pudimos cargar tus organizaciones',
  emptyTitle = 'Aún no perteneces a ninguna organización',
  emptyMessage = 'Crea una nueva o únete con un código de invitación.',
  emptyIcon = 'business-outline',
}) => {
  if (status === 'loading') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={loadingText}
        className="items-center py-12"
      >
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text className="mt-3 text-sm text-neutral-muted">{loadingText}</Text>
      </View>
    );
  }

  const isError = status === 'error';

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full items-center bg-cardBg border border-borderBg rounded-3xl p-6"
    >
      <View className="w-14 h-14 rounded-full bg-tertiary items-center justify-center mb-3">
        <Ionicons
          name={isError ? 'cloud-offline-outline' : emptyIcon}
          size={26}
          color={ThemeColors.primary}
        />
      </View>
      <Text accessibilityRole="header" className="text-base font-extrabold text-neutral mb-1">
        {isError ? errorTitle : emptyTitle}
      </Text>
      <Text className="text-sm text-neutral-muted text-center">
        {isError
          ? (message ?? 'Inténtalo de nuevo en unos segundos.')
          : emptyMessage}
      </Text>
      {isError && onRetry ? (
        <View className="w-full mt-4">
          <AppButton title="Reintentar" icon="refresh-outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
};
