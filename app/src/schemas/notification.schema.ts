import { z } from 'zod';

// Esquemas del centro de notificaciones (Fase 4). Coinciden con los contratos proyectados
// Notificacion, TipoNotificacion, ModoAlerta y PreferenciasNotificacion de api/openapi.yaml. Por
// ahora los datos son de ejemplo (`src/mocks/notifications.ts`).

export const notificationTypeSchema = z.enum([
  'TURNO_ASIGNADO',
  'TURNO_ACTUALIZADO',
  'TAREA_ASIGNADA',
  'TAREA_ACTUALIZADA',
  'ASISTENCIA_REGISTRADA',
  'QR_DISPONIBLE',
  'RECORDATORIO_SALIDA',
  'MIEMBRO_NUEVO',
  'SISTEMA',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  /** Id del destinatario (`notificaciones_usuario`): sobre él se marca «leída». */
  id: z.string(),
  notificacionId: z.string(),
  organizacionId: z.string().nullable(),
  tipo: notificationTypeSchema,
  titulo: z.string(),
  contenido: z.string().nullable(),
  /** Tarea (TAREA_*) o plantilla de turno (TURNO_*) a la que lleva. */
  referenciaId: z.string().nullable(),
  actor: z.object({ id: z.string(), nombre: z.string() }).nullable(),
  asistencia: z.object({ puntual: z.boolean(), turno: z.string() }).nullable(),
  leida: z.boolean(),
  leidaEn: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationsSchema = z.array(notificationSchema);

export const alertModeSchema = z.enum(['SONIDO', 'VIBRACION', 'SILENCIO']);
export type AlertMode = z.infer<typeof alertModeSchema>;

export const notificationPreferencesSchema = z.object({
  push: z.boolean(),
  recordatoriosFichaje: z.boolean(),
  novedadesTareas: z.boolean(),
  modoAlerta: alertModeSchema,
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/** Categorías de los chips de filtro; agrupan los tipos (ver `NOTIFICATION_TYPES`). */
export const notificationCategorySchema = z.enum(['TURNOS', 'TAREAS', 'ASISTENCIA', 'SISTEMA']);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const notificationReadFilterSchema = z.enum(['TODAS', 'NO_LEIDAS']);
export type NotificationReadFilter = z.infer<typeof notificationReadFilterSchema>;
