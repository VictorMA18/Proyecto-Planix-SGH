import { z } from 'zod';

// Esquemas de la pestaña «Tareas» (Fase 3). Coinciden con los contratos proyectados TareaCalendario,
// TareaDetalle, Subtarea, ComentarioTarea, ActividadTarea, PrioridadTarea y EstadoTarea de
// api/openapi.yaml. Por ahora los datos son de ejemplo (`src/mocks/tasks.ts`).

/** ALTA se muestra como «Alta prioridad» (urgente) y MEDIA como «Normal». */
export const taskPrioritySchema = z.enum(['ALTA', 'MEDIA', 'BAJA']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

/** Flujo de la tarea: Por hacer → En progreso → Revisión → Completada. */
export const taskStatusSchema = z.enum(['PENDIENTE', 'EN_PROGRESO', 'REVISION', 'COMPLETADA']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskPersonSchema = z.object({
  miembroId: z.string().nullable(),
  nombre: z.string(),
  avatarUrl: z.string().nullable(),
});
export type TaskPerson = z.infer<typeof taskPersonSchema>;

export const calendarTaskSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string().nullable(),
  prioridad: taskPrioritySchema,
  estado: taskStatusSchema,
  fechaInicio: z.iso.datetime(),
  /** Hora de fin del mismo día: el vencimiento de la tarea. */
  fechaFin: z.iso.datetime().nullable(),
  ubicacion: z.string().nullable(),
  etiquetas: z.array(z.string()),
  asignados: z.array(taskPersonSchema.extend({ miembroId: z.string() })),
  asignadaAMi: z.boolean(),
  subtareas: z.object({ completadas: z.number().int().min(0), total: z.number().int().min(0) }),
  comentarios: z.number().int().min(0),
  creadaPor: taskPersonSchema,
});
export type CalendarTask = z.infer<typeof calendarTaskSchema>;
export const calendarTasksSchema = z.array(calendarTaskSchema);

export const subtaskSchema = z.object({ id: z.string(), titulo: z.string(), completada: z.boolean() });
export type Subtask = z.infer<typeof subtaskSchema>;

/** Solo PDF e imágenes (documentacion/03, campo `adjuntos`). */
export const attachmentSchema = z.object({
  id: z.string(),
  tipo: z.enum(['IMAGEN', 'ARCHIVO']),
  nombreArchivo: z.string(),
  mimeType: z.string(),
  tamanoBytes: z.number().int().min(0),
  url: z.string(),
  /**
   * Solo en el formulario: adjunto elegido pero aún sin subir (id `local-…`). En la web es el
   * `File` del selector; en el móvil basta con `url` (la uri local).
   */
  archivo: z.custom<Blob>((value) => typeof Blob !== 'undefined' && value instanceof Blob).optional(),
});

/** Adjunto elegido en el formulario que todavía no se subió. */
export const isLocalAttachment = (attachment: { id: string }) => attachment.id.startsWith('local-');
export type Attachment = z.infer<typeof attachmentSchema>;

export const taskDetailSchema = calendarTaskSchema.extend({
  listaSubtareas: z.array(subtaskSchema),
  adjuntos: z.array(attachmentSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type TaskDetail = z.infer<typeof taskDetailSchema>;

export const taskCommentSchema = z.object({
  id: z.string(),
  autor: taskPersonSchema,
  texto: z.string(),
  createdAt: z.iso.datetime(),
});
export type TaskComment = z.infer<typeof taskCommentSchema>;

export const taskActivitySchema = z.object({
  id: z.string(),
  tipo: z.enum(['CREADA', 'EDITADA', 'ESTADO', 'ASIGNADOS', 'SUBTAREA', 'COMENTARIO', 'ADJUNTO', 'DUPLICADA']),
  actor: taskPersonSchema,
  descripcion: z.string(),
  createdAt: z.iso.datetime(),
});
export type TaskActivity = z.infer<typeof taskActivitySchema>;

// ---------------------------------------------------------------------------------------------
// Formularios

export const commentFormSchema = z.object({
  texto: z.string().trim().min(1, 'Escribe un comentario.').max(1000, 'Máximo 1000 caracteres.'),
});

export const subtaskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Escribe la subtarea.')
  .max(120, 'Máximo 120 caracteres.');

export const tagSchema = z
  .string()
  .trim()
  .min(1, 'Escribe la etiqueta.')
  .max(24, 'Máximo 24 caracteres.');

const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm, por ejemplo 09:30.');

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Formulario de crear y editar una tarea. */
export const taskFormSchema = z
  .object({
    titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(200, 'Máximo 200 caracteres.'),
    estado: taskStatusSchema,
    prioridad: taskPrioritySchema,
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha.'),
    horaInicio: timeSchema,
    horaFin: timeSchema.or(z.literal('')),
    ubicacion: z.string().trim().max(120, 'Máximo 120 caracteres.'),
    miembroIds: z.array(z.string()).min(1, 'Asigna al menos a una persona.'),
    etiquetas: z.array(tagSchema).max(5, 'Máximo 5 etiquetas.'),
    descripcion: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
    subtareas: z.array(z.object({ id: z.string().optional(), titulo: subtaskTitleSchema, completada: z.boolean() })),
    adjuntos: z.array(attachmentSchema).max(10, 'Máximo 10 archivos.'),
  })
  .refine((form) => !form.horaFin || form.horaFin > form.horaInicio, {
    path: ['horaFin'],
    message: 'La hora de fin debe ser posterior a la de inicio.',
  });
export type TaskFormInput = z.infer<typeof taskFormSchema>;

// ---------------------------------------------------------------------------------------------
// Filtros de la pantalla (estado de UI en `useTasksStore`)

export const taskPriorityFilterSchema = z.enum(['TODAS', ...taskPrioritySchema.options]);
export type TaskPriorityFilter = z.infer<typeof taskPriorityFilterSchema>;

/** «Vencidas»: sin completar y con la hora de fin ya pasada. */
export const taskStatusFilterSchema = z.enum(['TODAS', ...taskStatusSchema.options, 'VENCIDAS']);
export type TaskStatusFilter = z.infer<typeof taskStatusFilterSchema>;

export const taskSortSchema = z.enum(['HORA', 'PRIORIDAD']);
export type TaskSort = z.infer<typeof taskSortSchema>;
