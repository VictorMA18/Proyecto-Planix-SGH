import type { Ionicons } from '@expo/vector-icons';

/** Pestaña a la que se llega al elegir una organización (Inicio, según el rol). */
export const DEFAULT_TAB_HREF = '/inicio';

export interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

export const TAB_ITEMS: TabItem[] = [
  { name: 'inicio', label: 'Inicio', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'asistencia', label: 'Asistencia', icon: 'qr-code-outline', iconActive: 'qr-code' },
  { name: 'tareas', label: 'Tareas', icon: 'checkbox-outline', iconActive: 'checkbox' },
  { name: 'metricas', label: 'Métricas', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'equipo', label: 'Equipo', icon: 'people-outline', iconActive: 'people' },
];
