import { z } from 'zod';

// Pestaña «Métricas» y reporte exportable (Fase 5). Coinciden con MetricasPeriodo,
// ResumenColaborador, PaginaColaboradores y RegistroDiario de api/openapi.yaml.

const roleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLEADO']);

export const periodTypeSchema = z.enum(['SEMANA', 'MES']);
export type PeriodType = z.infer<typeof periodTypeSchema>;

export const reportFormatSchema = z.enum(['PDF', 'XLSX']);
export type ReportFormat = z.infer<typeof reportFormatSchema>;

export const punctualityLevelSchema = z.enum(['EXCELENTE', 'BUENO', 'MEJORABLE']);
export type PunctualityLevel = z.infer<typeof punctualityLevelSchema>;

export const collaboratorSummarySchema = z.object({
  miembroId: z.string(),
  nombre: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  rol: roleSchema,
  turno: z.string().nullable(),
  diasTrabajados: z.number().int().min(0),
  asistenciaPct: z.number().nullable(),
  puntualidadPct: z.number().nullable(),
  horas: z.number(),
  horasExtra: z.number(),
  metaAlcanzada: z.boolean(),
});
export type CollaboratorSummary = z.infer<typeof collaboratorSummarySchema>;

export const collaboratorsPageSchema = z.object({
  items: z.array(collaboratorSummarySchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type CollaboratorsPage = z.infer<typeof collaboratorsPageSchema>;

export const dailyLogEntrySchema = z.object({
  fecha: z.string(),
  conTurno: z.boolean(),
  entrada: z.string().nullable(),
  salida: z.string().nullable(),
  horas: z.number(),
  puntual: z.boolean().nullable(),
  minutosTarde: z.number().int().nullable(),
  horasExtra: z.number(),
  marcas: z.number().int().min(0),
  escaneos: z.array(z.object({ tipo: z.enum(['ENTRADA', 'SALIDA']), hora: z.string() })),
});
export type DailyLogEntry = z.infer<typeof dailyLogEntrySchema>;

export const chartBarSchema = z.object({
  etiqueta: z.string(),
  desde: z.string(),
  hasta: z.string(),
  horas: z.number(),
});
export type ChartBar = z.infer<typeof chartBarSchema>;

export const metricsPeriodSchema = z.object({
  periodo: z.object({ tipo: periodTypeSchema, desde: z.string(), hasta: z.string() }),
  alcance: z.enum(['EQUIPO', 'MIEMBRO']),
  miembro: z
    .object({
      miembroId: z.string(),
      nombre: z.string(),
      avatarUrl: z.string().nullable(),
      rol: roleSchema,
      turno: z.string().nullable(),
    })
    .nullable(),
  miembrosActivos: z.number().int().min(0),
  tendencia: z.object({
    promedioDiarioHoras: z.number(),
    variacionPct: z.number().nullable(),
    metaDiariaHoras: z.number(),
    barras: z.array(chartBarSchema),
    mejor: z
      .object({ etiqueta: z.string(), horas: z.number(), variacionPct: z.number().nullable() })
      .nullable(),
  }),
  horas: z.object({
    trabajadas: z.number(),
    planificadas: z.number(),
    restantes: z.number(),
    cumplimientoPct: z.number().nullable(),
  }),
  puntualidad: z.object({
    porcentaje: z.number().nullable(),
    aTiempo: z.number().int().min(0),
    evaluadas: z.number().int().min(0),
    nivel: punctualityLevelSchema.nullable(),
  }),
  horasExtra: z.object({ total: z.number(), hoy: z.number() }),
  colaboradores: z
    .object({ total: z.number().int().min(0), top: z.array(collaboratorSummarySchema) })
    .nullable(),
  registroDiario: z.array(dailyLogEntrySchema).nullable(),
  tareas: z.object({ completadas: z.number().int().min(0), total: z.number().int().min(0) }).nullable(),
});
export type MetricsPeriod = z.infer<typeof metricsPeriodSchema>;
