import { z } from 'zod';

// Esquemas de «Asistencia» y «Configuración de turnos». Coinciden con los contratos AsistenciaHoy,
// JornadaAsistencia, JornadaAsistenciaPage y ConfiguracionTurnos de api/openapi.yaml.

export const attendanceMovementSchema = z.object({
  id: z.string(),
  tipo: z.enum(['ENTRADA', 'SALIDA']),
  hora: z.iso.datetime(),
});
export type AttendanceMovement = z.infer<typeof attendanceMovementSchema>;

/** Turno que aplica hoy (o el que se copió al registrar la entrada). */
export const shiftTodaySchema = z.object({
  nombre: z.string(),
  inicio: z.iso.datetime(),
  fin: z.iso.datetime(),
  /** Minutos que dura el turno. */
  objetivoMin: z.number().int().positive(),
});
export type ShiftToday = z.infer<typeof shiftTodaySchema>;

export const journeySchema = z.object({
  id: z.string(),
  fecha: z.string(),
  horaInicio: z.iso.datetime(),
  horaFin: z.iso.datetime().nullable(),
  estadoActual: z.enum(['DENTRO', 'FUERA']),
  turno: z.object({ nombre: z.string(), inicio: z.iso.datetime(), fin: z.iso.datetime() }).nullable(),
  minutosTarde: z.number().int().min(0).nullable(),
  puntual: z.boolean().nullable(),
  /** Trabajado hasta la hora del servidor de la respuesta. */
  minutosTrabajados: z.number().int().min(0),
  movimientos: z.array(attendanceMovementSchema),
});
export type Journey = z.infer<typeof journeySchema>;

export const attendanceTodaySchema = z.object({
  fecha: z.string(),
  toleranciaMin: z.number().int(),
  turno: shiftTodaySchema.nullable(),
  /** `null` mientras el usuario no registra su primera entrada del día. */
  jornada: journeySchema.nullable(),
  /** Hora del servidor con la que se calcularon los minutos. */
  calculadoEn: z.iso.datetime(),
});
export type AttendanceToday = z.infer<typeof attendanceTodaySchema>;

export const journeyPageSchema = z.object({
  data: z.array(journeySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});
export type JourneyPage = z.infer<typeof journeyPageSchema>;

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
  equipo: z.array(z.object({ id: z.string(), nombre: z.string(), avatarUrl: z.string().nullable() })),
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

/** Tolerancias de entrada que se ofrecen en la configuración, en minutos. */
export const toleranceSchema = z.number().int().min(0).max(120);
export const TOLERANCE_OPTIONS = [0, 5, 10, 15, 20, 30] as const;
