import { create } from 'zustand';

import type { TaskPriorityFilter, TaskSort, TaskStatusFilter } from '@/schemas/task.schema';
import { toDateKey } from '@/utils/tasks';

// Estado de UI de la pestaña «Tareas»: mes visible, día elegido, filtros y orden. Las tareas vienen
// de TanStack Query (`services/tasks.ts`), no de aquí.
interface TasksState {
  /** Mes visible del calendario (`YYYY-MM`). */
  month: string;
  /** Día elegido (`YYYY-MM-DD`). */
  selectedDate: string;
  /** Miembro por el que se filtra (`null` = todos). */
  memberId: string | null;
  priority: TaskPriorityFilter;
  status: TaskStatusFilter;
  sort: TaskSort;
  /** Cambia de mes y elige su primer día (o hoy, si es el mes actual). */
  shiftMonth: (delta: number) => void;
  /** Salta a un mes (`YYYY-MM`) y elige su primer día (o hoy, si es el mes actual). */
  setMonth: (month: string) => void;
  selectDate: (date: string) => void;
  goToday: () => void;
  setMemberId: (memberId: string | null) => void;
  setPriority: (priority: TaskPriorityFilter) => void;
  setStatus: (status: TaskStatusFilter) => void;
  toggleSort: () => void;
  resetFilters: () => void;
}

const today = () => toDateKey(new Date());

export const useTasksStore = create<TasksState>((set) => ({
  month: today().slice(0, 7),
  selectedDate: today(),
  memberId: null,
  priority: 'TODAS',
  status: 'TODAS',
  sort: 'HORA',
  shiftMonth: (delta) =>
    set((state) => {
      const [y, m] = state.month.split('-').map(Number);
      const first = new Date(y, m - 1 + delta, 1);
      const month = toDateKey(first).slice(0, 7);
      return { month, selectedDate: month === today().slice(0, 7) ? today() : toDateKey(first) };
    }),
  setMonth: (month) => set({ month, selectedDate: month === today().slice(0, 7) ? today() : `${month}-01` }),
  selectDate: (date) => set({ selectedDate: date, month: date.slice(0, 7) }),
  goToday: () => set({ selectedDate: today(), month: today().slice(0, 7) }),
  setMemberId: (memberId) => set({ memberId }),
  setPriority: (priority) => set({ priority }),
  setStatus: (status) => set({ status }),
  toggleSort: () => set((state) => ({ sort: state.sort === 'HORA' ? 'PRIORIDAD' : 'HORA' })),
  resetFilters: () => set({ memberId: null, priority: 'TODAS', status: 'TODAS' }),
}));
