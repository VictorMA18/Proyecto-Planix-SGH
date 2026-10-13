import { z } from 'zod';

// Esquemas del centro de notificaciones (Fase 4). Coinciden con los contratos Notificacion,
// TipoNotificacion, ModoAlerta, PreferenciasNotificacion y PushToken de api/openapi.yaml.

export const notificationTypeSchema = z.enum([
  'TURNO_ASIGNADO',
  'TURNO_ACTUALIZADO',
  'TAREA_ASIGNADA',
  'TAREA_ACTUALIZADA',
  'ASISTENCIA_REGISTRADA',
  'QR_DISPONIBLE',
  'RECORDATORIO_ENTRADA',
  'RECORDATORIO_SALIDA',
  'AVISO',
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
export const notificationCategorySchema = z.enum(['TURNOS', 'TAREAS', 'ASISTENCIA', 'AVISOS', 'SISTEMA']);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

/** A quién llega un aviso: a todo el equipo o solo a los miembros elegidos. */
export const broadcastAudienceSchema = z.enum(['TODOS', 'MIEMBROS']);
export type BroadcastAudience = z.infer<typeof broadcastAudienceSchema>;

/** Formulario de «Difundir aviso» (POST /organizaciones/{id}/notificaciones/difusion). */
export const broadcastFormSchema = z
  .object({
    titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
    contenido: z.string().trim().min(1, 'Escribe el mensaje del aviso.').max(500, 'Máximo 500 caracteres.'),
    destinatarios: broadcastAudienceSchema,
    miembroIds: z.array(z.string()),
  })
  .refine((form) => form.destinatarios === 'TODOS' || form.miembroIds.length > 0, {
    path: ['miembroIds'],
    message: 'Elige al menos a un miembro.',
  });
export type BroadcastFormInput = z.infer<typeof broadcastFormSchema>;

/** Cuerpo de la petición: sin `miembroIds`, el aviso llega a todos los miembros activos. */
export const toBroadcastRequest = ({ titulo, contenido, destinatarios, miembroIds }: BroadcastFormInput) => ({
  titulo,
  contenido,
  ...(destinatarios === 'MIEMBROS' ? { miembroIds } : {}),
});
export type BroadcastRequest = ReturnType<typeof toBroadcastRequest>;

export const broadcastResultSchema = z.object({ notificacionesCreadas: z.number().int().min(0) });

/** Respuesta de `POST /push-tokens` (solo lo que usa la app). */
export const pushTokenSchema = z.object({ id: z.string(), activo: z.boolean() });

/** Lo que hay que enviar para registrar este dispositivo o navegador. */
export type PushTokenInput =
  | { plataforma: 'ANDROID' | 'IOS'; expoPushToken: string }
  | { plataforma: 'WEB'; webPushSubscription: { endpoint: string; keys: { p256dh: string; auth: string } } };

export const notificationReadFilterSchema = z.enum(['TODAS', 'NO_LEIDAS']);
export type NotificationReadFilter = z.infer<typeof notificationReadFilterSchema>;
