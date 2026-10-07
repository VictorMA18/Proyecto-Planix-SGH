import { create } from 'zustand';

import type { TeamFilter } from '@/schemas/team.schema';

// Estado de UI de «Equipo y Miembros». Los datos del equipo vienen de TanStack Query, no de aquí.
interface TeamState {
  search: string;
  filter: TeamFilter;
  page: number;
  setSearch: (search: string) => void;
  setFilter: (filter: TeamFilter) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const initialState = { search: '', filter: 'TODOS' as TeamFilter, page: 1 };

export const useTeamStore = create<TeamState>((set) => ({
  ...initialState,
  // Cambiar la búsqueda o el filtro vuelve a la primera página.
  setSearch: (search) => set({ search, page: 1 }),
  setFilter: (filter) => set({ filter, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(initialState),
}));
