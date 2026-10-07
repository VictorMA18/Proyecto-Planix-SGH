import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { ThemeColors } from '@/constants/theme';

interface MembershipsStateProps {
  status: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

/** Estados sin datos de las listas de organizaciones: cargando, error y vacío. */
export const MembershipsState: React.FC<MembershipsStateProps> = ({ status, message, onRetry }) => {
  if (status === 'loading') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Cargando organizaciones"
        className="items-center py-12"
      >
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text className="mt-3 text-sm text-neutral-muted">Cargando tus organizaciones…</Text>
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
          name={isError ? 'cloud-offline-outline' : 'business-outline'}
          size={26}
          color={ThemeColors.primary}
        />
      </View>
      <Text accessibilityRole="header" className="text-base font-extrabold text-neutral mb-1">
        {isError ? 'No pudimos cargar tus organizaciones' : 'Aún no perteneces a ninguna organización'}
      </Text>
      <Text className="text-sm text-neutral-muted text-center">
        {isError
          ? (message ?? 'Inténtalo de nuevo en unos segundos.')
          : 'Crea una nueva o únete con un código de invitación.'}
      </Text>
      {isError && onRetry ? (
        <View className="w-full mt-4">
          <AppButton title="Reintentar" icon="refresh-outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
};
