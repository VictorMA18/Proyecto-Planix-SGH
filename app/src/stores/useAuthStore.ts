import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

interface PendingVerification {
  identifier: string;
  flow: 'sign-in' | 'sign-up';
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  rememberedEmail: string;
  rememberMe: boolean;
  pendingVerification: PendingVerification | null;
  hasHydrated: boolean;
  setRememberedEmail: (email: string, remember: boolean) => void;
  setPendingVerification: (data: PendingVerification | null) => void;
  clearPendingVerification: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      rememberedEmail: '',
      rememberMe: true,
      pendingVerification: null,
      hasHydrated: false,
      setRememberedEmail: (email, remember) =>
        set({
          rememberedEmail: remember ? email : '',
          rememberMe: remember,
        }),
      setPendingVerification: (data) => set({ pendingVerification: data }),
      clearPendingVerification: () => set({ pendingVerification: null }),
    }),
    {
      name: 'sgh-auth-preferences',
      storage: persistStorage,
      // Solo se persisten las preferencias; la verificación pendiente es efímera.
      partialize: (state) => ({
        rememberedEmail: state.rememberedEmail,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    }
  )
);
