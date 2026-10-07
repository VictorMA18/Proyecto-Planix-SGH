import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// SecureStore no existe en web: allí se usa localStorage.
const stateStorage: StateStorage =
  Platform.OS === 'web'
    ? {
        getItem: (name) => {
          try {
            return globalThis.localStorage?.getItem(name) ?? null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            globalThis.localStorage?.setItem(name, value);
          } catch {}
        },
        removeItem: (name) => {
          try {
            globalThis.localStorage?.removeItem(name);
          } catch {}
        },
      }
    : {
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      };

export const persistStorage = createJSONStorage(() => stateStorage);
