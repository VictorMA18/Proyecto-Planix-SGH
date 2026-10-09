import { z } from 'zod';

// Esquemas de la pestaña «Asistencia». `movimientos` y `estadoActual` siguen el contrato definido de
// JornadaAsistencia (api/openapi.yaml); `turno` es proyectado. Las plantillas de turno corresponden a
// ConfiguracionTurnos (proyectado). Por ahora los datos son de ejemplo.

export const attendanceMovementSchema = z.object({
  id: z.string(),
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  hora: z.iso.datetime(),
});
export type AttendanceMovement = z.infer<typeof attendanceMovementSchema>;

export const attendanceTodaySchema = z.object({
  turno: z.object({
    nombre: z.string(),
    inicio: z.iso.datetime(),
    fin: z.iso.datetime(),
    /** Minutos que se esperan trabajar en el turno. */
    objetivoMin: z.number().int().positive(),
  }),
  /** `null` mientras el usuario no registra su primera entrada del día. */
  jornada: z
    .object({
      estadoActual: z.enum(['DENTRO', 'FUERA']),
      movimientos: z.array(attendanceMovementSchema),
    })
    .nullable(),
});
export type AttendanceToday = z.infer<typeof attendanceTodaySchema>;

/** 1 = lunes … 7 = domingo. */
export const weekdaySchema = z.number().int().min(1).max(7);

export const shiftTemplateSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  horas: z.number().positive(),
  dias: z.array(weekdaySchema),
  asignados: z.number().int().min(0),
  /** Identificadores de todos los miembros asignados a la plantilla. */
  miembroIds: z.array(z.string()),
  equipo: z.array(
    z.object({ id: z.string(), nombre: z.string(), avatarUrl: z.string().nullable().optional() }),
  ),
});
export type ShiftTemplate = z.infer<typeof shiftTemplateSchema>;

export const shiftsConfigSchema = z.object({
  plantillas: z.array(shiftTemplateSchema),
  resumen: z.object({
    activas: z.number().int().min(0),
    cubiertos: z.number().int().min(0),
    toleranciaMin: z.number().int().min(0),
  }),
});
export type ShiftsConfig = z.infer<typeof shiftsConfigSchema>;

const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm, por ejemplo 07:30.');

/** Formulario de plantilla de turno (crear y editar). */
export const shiftFormSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe un nombre de al menos 2 caracteres.').max(60, 'Máximo 60 caracteres.'),
    horaInicio: timeSchema,
    horaFin: timeSchema,
    dias: z.array(weekdaySchema).min(1, 'Elige al menos un día.'),
    miembroIds: z.array(z.string()),
  })
  .refine((value) => value.horaInicio !== value.horaFin, {
    path: ['horaFin'],
    message: 'La hora de fin debe ser distinta a la de inicio.',
  });
export type ShiftFormInput = z.infer<typeof shiftFormSchema>;
