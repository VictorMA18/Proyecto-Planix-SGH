import { create } from 'zustand';

import type { NotificationCategory, NotificationReadFilter } from '@/schemas/notification.schema';

// Estado de UI del centro de notificaciones: filtro de lectura y categoría. Las notificaciones
// vienen de TanStack Query (`services/notifications.ts`), no de aquí.
interface NotificationsState {
  read: NotificationReadFilter;
  /** Categoría elegida (`null` = todas). */
  category: NotificationCategory | null;
  setRead: (read: NotificationReadFilter) => void;
  /** Elige la categoría o, si ya estaba elegida, la quita. */
  toggleCategory: (category: NotificationCategory) => void;
  /** Abre la bandeja en una categoría (p. ej. «Avisos» tras difundir uno). */
  showCategory: (category: NotificationCategory) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  read: 'TODAS',
  category: null,
  setRead: (read) => set({ read }),
  toggleCategory: (category) => set((state) => ({ category: state.category === category ? null : category })),
  showCategory: (category) => set({ read: 'TODAS', category }),
}));
