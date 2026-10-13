import type { Ionicons } from '@expo/vector-icons';

import type {
  AlertMode,
  NotificationCategory,
  NotificationPreferences,
  NotificationReadFilter,
  NotificationType,
} from '@/schemas/notification.schema';

type IconName = keyof typeof Ionicons.glyphMap;

/** Categoría, icono y acción de cada tipo. `action` es el botón que lleva a su pantalla. */
export const NOTIFICATION_TYPES: Record<
  NotificationType,
  { category: NotificationCategory; icon: IconName; action?: 'TURNO' | 'TAREA' }
> = {
  TURNO_ASIGNADO: { category: 'TURNOS', icon: 'calendar-outline', action: 'TURNO' },
  TURNO_ACTUALIZADO: { category: 'TURNOS', icon: 'sync-outline', action: 'TURNO' },
  TAREA_ASIGNADA: { category: 'TAREAS', icon: 'clipboard-outline', action: 'TAREA' },
  TAREA_ACTUALIZADA: { category: 'TAREAS', icon: 'checkbox-outline', action: 'TAREA' },
  ASISTENCIA_REGISTRADA: { category: 'ASISTENCIA', icon: 'qr-code-outline' },
  QR_DISPONIBLE: { category: 'ASISTENCIA', icon: 'qr-code-outline' },
  RECORDATORIO_ENTRADA: { category: 'ASISTENCIA', icon: 'alarm-outline' },
  RECORDATORIO_SALIDA: { category: 'ASISTENCIA', icon: 'exit-outline' },
  AVISO: { category: 'AVISOS', icon: 'megaphone-outline' },
  MIEMBRO_NUEVO: { category: 'SISTEMA', icon: 'person-add-outline' },
  SISTEMA: { category: 'SISTEMA', icon: 'information-circle-outline' },
};

export const NOTIFICATION_ACTIONS: Record<'TURNO' | 'TAREA', { label: string; icon: IconName }> = {
  TURNO: { label: 'Ver turno', icon: 'arrow-forward' },
  TAREA: { label: 'Abrir tarea', icon: 'open-outline' },
};

export const NOTIFICATION_CATEGORIES: { value: NotificationCategory; label: string; icon: IconName }[] = [
  { value: 'TURNOS', label: 'Turnos', icon: 'calendar-outline' },
  { value: 'TAREAS', label: 'Tareas', icon: 'checkmark-circle-outline' },
  { value: 'ASISTENCIA', label: 'Asistencia', icon: 'qr-code-outline' },
  { value: 'AVISOS', label: 'Avisos', icon: 'megaphone-outline' },
  { value: 'SISTEMA', label: 'Sistema', icon: 'business-outline' },
];

export const NOTIFICATION_READ_FILTERS: { value: NotificationReadFilter; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'NO_LEIDAS', label: 'No leídas' },
];

/** Interruptores de «Canales y alertas» en los ajustes. */
export const NOTIFICATION_CHANNELS: {
  key: Exclude<keyof NotificationPreferences, 'modoAlerta'>;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    key: 'push',
    label: 'Notificaciones push',
    description: 'Turnos asignados, cambios y avisos urgentes',
    icon: 'notifications-outline',
  },
  {
    key: 'recordatoriosFichaje',
    label: 'Recordatorios de fichaje',
    description: '15 min antes del inicio y del término del turno',
    icon: 'alarm-outline',
  },
  {
    key: 'novedadesTareas',
    label: 'Novedades de tareas',
    description: 'Avances, comentarios y subtareas de tus tareas',
    icon: 'list-outline',
  },
];

export const ALERT_MODES: { value: AlertMode; label: string; icon: IconName }[] = [
  { value: 'SONIDO', label: 'Sonido', icon: 'volume-high-outline' },
  { value: 'VIBRACION', label: 'Vibración', icon: 'phone-portrait-outline' },
  { value: 'SILENCIO', label: 'Silencio', icon: 'volume-mute-outline' },
];

/** Valores por defecto (los mismos que devuelve el backend si el usuario nunca guardó). */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push: true,
  recordatoriosFichaje: true,
  novedadesTareas: true,
  modoAlerta: 'SONIDO',
};
