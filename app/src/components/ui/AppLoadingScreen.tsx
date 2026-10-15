import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';

interface AppLoadingScreenProps {
  message?: string;
}

/**
 * Portada de carga de Planix: continúa la pantalla de carga nativa (mismo fondo y logo) mientras
 * se prepara la sesión. Se muestra cuando las fuentes ya cargaron.
 */
export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({ message = 'Preparando tu espacio…' }) => (
  <View
    accessible
    accessibilityLabel={`Planix. ${message}`}
    accessibilityLiveRegion="polite"
    className="flex-1 items-center justify-center bg-screenBg px-8"
  >
    {/* Tamaño en `style`: en la web el Image no recibe el className. */}
    <Image
      source={require('../../../assets/images/planix-logo.png')}
      style={{ width: 120, height: 120 }}
      resizeMode="contain"
    />
    <Text className="mt-6 text-4xl font-extrabold tracking-tight text-neutral">Planix</Text>
    <Text className="mt-2 text-center text-sm text-neutral-muted">Turnos, asistencia y tareas de tu equipo</Text>
    <View className="mt-10 flex-row items-center gap-2">
      <ActivityIndicator color={ThemeColors.primary} />
      <Text className="text-sm font-medium text-primary">{message}</Text>
    </View>
  </View>
);
