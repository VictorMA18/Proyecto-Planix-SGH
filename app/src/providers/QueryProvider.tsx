import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { ApiError } from '@/services/api-client';

// Los errores 4xx son definitivos (permisos, datos inválidos): reintentarlos no ayuda.
const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2;

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * En React Native no existe el «foco de ventana» del navegador: se conecta al `AppState` para que,
 * al volver la app a primer plano, se recarguen los datos desactualizados (receta oficial de
 * TanStack Query). En la web lo maneja el propio navegador.
 */
function useAppStateFocus() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) =>
      focusManager.setFocused(status === 'active'),
    );
    return () => subscription.remove();
  }, []);
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  useAppStateFocus();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos; las consultas «en vivo» lo bajan (comentarios, actividad)
            retry: shouldRetry,
            // Solo recarga lo desactualizado al volver a la app (o a la pestaña en la web).
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
