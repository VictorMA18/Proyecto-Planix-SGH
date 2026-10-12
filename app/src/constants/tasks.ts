import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type {
  TaskPriority,
  TaskPriorityFilter,
  TaskSort,
  TaskStatus,
  TaskStatusFilter,
} from '@/schemas/task.schema';

/** Etiquetas y colores de prioridad. MEDIA se muestra como «Normal», como en el diseño. */
export const TASK_PRIORITY: Record<TaskPriority, { label: string; short: string; color: string; background: string }> = {
  ALTA: { label: 'Alta prioridad', short: 'Alta', color: ThemeStatus.errorText, background: ThemeStatus.errorBg },
  MEDIA: { label: 'Normal', short: 'Normal', color: ThemeColors.primary, background: ThemeColors.tertiary },
  BAJA: { label: 'Baja', short: 'Baja', color: ThemeColors.mutedText, background: '#F1F0F5' },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; step: string; color: string; background: string }> = {
  PENDIENTE: { label: 'Por hacer', step: 'Por hacer', color: ThemeStatus.warningText, background: ThemeStatus.warningBg },
  EN_PROGRESO: { label: 'En progreso', step: 'Progreso', color: ThemeColors.secondary, background: ThemeColors.tertiary },
  REVISION: { label: 'En revisión', step: 'Revisión', color: ThemeStatus.info, background: ThemeStatus.infoBg },
  COMPLETADA: { label: 'Completada', step: 'Completada', color: ThemeStatus.success, background: ThemeStatus.successBg },
};

/** Colores de las etiquetas: cada texto conserva siempre el mismo color. */
const TAG_COLORS = [
  { color: '#15803D', background: '#DCFCE7' },
  { color: '#1D4ED8', background: '#DBEAFE' },
  { color: '#B45309', background: '#FEF3C7' },
  { color: '#BE185D', background: '#FCE7F3' },
  { color: '#5B30D9', background: '#EDE9FE' },
  { color: '#0E7490', background: '#CFFAFE' },
];

export function tagColor(tag: string) {
  let value = 0;
  for (let i = 0; i < tag.length; i++) value = (value * 31 + tag.toLowerCase().charCodeAt(i)) >>> 0;
  return TAG_COLORS[value % TAG_COLORS.length];
}

export const TASK_PRIORITY_FILTERS: { value: TaskPriorityFilter; label: string }[] = [
  { value: 'TODAS', label: 'Todas las prioridades' },
  { value: 'ALTA', label: 'Alta prioridad' },
  { value: 'MEDIA', label: 'Normal' },
  { value: 'BAJA', label: 'Baja' },
];

export const TASK_STATUS_FILTERS: { value: TaskStatusFilter; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'REVISION', label: 'En revisión' },
  { value: 'COMPLETADA', label: 'Completadas' },
  { value: 'VENCIDAS', label: 'Vencidas' },
];

export const TASK_SORT_LABEL: Record<TaskSort, string> = { HORA: 'Hora', PRIORIDAD: 'Prioridad' };

/** Puntos del calendario: rojo para urgente (ALTA), morado para normal (MEDIA) y gris para baja. */
export const TASK_DOT = { urgent: ThemeColors.error, normal: ThemeColors.primary, low: ThemeColors.mutedText } as const;
