import { create } from 'zustand';

// Identificador de push de ESTE dispositivo o navegador (no es un dato del servidor): se guarda
// al registrarlo para poder darlo de baja al cerrar sesión.
export type DevicePushId = { expoPushToken: string } | { endpoint: string };

interface PushState {
  device: DevicePushId | null;
  setDevice: (device: DevicePushId | null) => void;
}

export const usePushStore = create<PushState>((set) => ({
  device: null,
  setDevice: (device) => set({ device }),
}));
