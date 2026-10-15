import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PeriodType } from '@/schemas/metrics.schema';
import { toDateKey } from '@/utils/tasks';

import { persistStorage } from './storage';

// Estado de UI de la pestaña «Métricas»: periodo visible, a quién se mira y la búsqueda y página de
// «Ver todos». Las métricas vienen de TanStack Query (`services/metrics.ts`). Solo se recuerda el
// tipo de periodo (semana o mes).
interface MetricsState {
  periodType: PeriodType;
  /** Cualquier día del periodo visible (`YYYY-MM-DD`). */
  anchorDate: string;
  /** Miembro elegido (`null` = todo el equipo). */
  memberId: string | null;
  search: string;
  page: number;
  setPeriodType: (periodType: PeriodType) => void;
  setAnchorDate: (anchorDate: string) => void;
  setMemberId: (memberId: string | null) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  /** Al cambiar de organización: hoy, el equipo y sin búsqueda. */
  reset: () => void;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      periodType: 'SEMANA',
      anchorDate: toDateKey(new Date()),
      memberId: null,
      search: '',
      page: 1,
      setPeriodType: (periodType) => set({ periodType, page: 1 }),
      setAnchorDate: (anchorDate) => set({ anchorDate, page: 1 }),
      setMemberId: (memberId) => set({ memberId }),
      setSearch: (search) => set({ search, page: 1 }),
      setPage: (page) => set({ page }),
      reset: () => set({ anchorDate: toDateKey(new Date()), memberId: null, search: '', page: 1 }),
    }),
    {
      name: 'sgh-metrics',
      storage: persistStorage,
      partialize: (state) => ({ periodType: state.periodType }),
    },
  ),
);
