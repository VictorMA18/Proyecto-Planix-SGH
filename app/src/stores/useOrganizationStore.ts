import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

interface OrganizationState {
  /** Organización con la que opera el usuario; si ya no existe se usa la primera membresía. */
  activeOrganizationId: string | null;
  setActiveOrganization: (id: string | null) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      setActiveOrganization: (id) => set({ activeOrganizationId: id }),
    }),
    { name: 'sgh-active-organization', storage: persistStorage }
  )
);
