import { z } from 'zod';

import { shiftTodaySchema } from './attendance.schema';

// Esquemas de la pestaña «Inicio». `employeeHomeSchema` y `adminHomeSchema` coinciden con los
// contratos InicioEmpleado y PanelAdmin de api/openapi.yaml. Las tareas son de la Fase 3: por ahora
// son datos de ejemplo con la forma de TareaInicio (proyectado).

export const taskPrioritySchema = z.enum(['ALTA', 'MEDIA', 'BAJA']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const homeTaskSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  prioridad: taskPrioritySchema,
  estado: z.enum(['PENDIENTE', 'COMPLETADA']),
  estimadoMin: z.number().int().optional(),
  venceEn: z.iso.datetime().optional(),
  completadaEn: z.iso.datetime().optional(),
  participantes: z.number().int().optional(),
});
export type HomeTask = z.infer<typeof homeTaskSchema>;

const countOf = z.object({ completadas: z.number().int(), total: z.number().int() });

/** Tareas de Inicio (ejemplo hasta la Fase 3). */
export const homeTasksSchema = z.object({
  tareasHoy: z.array(homeTaskSchema),
  semana: countOf,
  organizacion: countOf,
});
export type HomeTasks = z.infer<typeof homeTasksSchema>;

export const employeeHomeSchema = z.object({
  fecha: z.string(),
  toleranciaMin: z.number().int(),
  turno: shiftTodaySchema.nullable(),
  estado: z.enum(['DENTRO', 'FUERA']),
  entrada: z
    .object({
      registradaEn: z.iso.datetime(),
      puntual: z.boolean().nullable(),
      minutosTarde: z.number().int().min(0).nullable(),
    })
    .nullable(),
  minutosTrabajados: z.number().int().min(0),
  calculadoEn: z.iso.datetime(),
  semana: z.object({
    minutosTrabajados: z.number().int().min(0),
    diasTrabajados: z.number().int().min(0),
    variacionPct: z.number().nullable(),
    puntualidad: z.number().min(0).max(100).nullable(),
  }),
});
export type EmployeeHome = z.infer<typeof employeeHomeSchema>;

export const dynamicQrSchema = z.object({
  token: z.string(),
  fecha: z.string(),
  expiraEn: z.iso.datetime(),
  ventanaSeg: z.number().int().positive(),
});
export type DynamicQr = z.infer<typeof dynamicQrSchema>;

export const adminHomeSchema = z.object({
  fecha: z.string(),
  /** Solo para ADMIN; el SUPERVISOR recibe `null`. */
  qr: dynamicQrSchema.nullable(),
  presencia: z.object({
    esperados: z.number().int().min(0),
    presentes: z.number().int().min(0),
    puntuales: z.number().int().min(0),
    retrasos: z.number().int().min(0),
    pendientes: z.number().int().min(0),
  }),
  puntualidadSemanal: z.object({
    promedio: z.number().min(0).max(100).nullable(),
    dias: z.array(
      z.object({ dia: z.string(), fecha: z.string(), valor: z.number().min(0).max(100).nullable() }),
    ),
  }),
  asistenciasRecientes: z.array(
    z.object({
      id: z.string(),
      miembroId: z.string().nullable(),
      nombre: z.string(),
      avatarUrl: z.string().nullable(),
      area: z.string(),
      hora: z.iso.datetime(),
      estado: z.enum(['PUNTUAL', 'TARDE', 'SIN_TURNO']),
      minutosTarde: z.number().int().min(0).nullable(),
    }),
  ),
});
export type AdminHome = z.infer<typeof adminHomeSchema>;
