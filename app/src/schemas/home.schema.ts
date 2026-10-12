import { z } from 'zod';

import { shiftTodaySchema } from './attendance.schema';
import { calendarTaskSchema } from './task.schema';

// Esquemas de la pestaña «Inicio». `employeeHomeSchema` y `adminHomeSchema` coinciden con los
// contratos InicioEmpleado y PanelAdmin de api/openapi.yaml.

/** Tareas de la semana actual (lunes a domingo). */
export const taskProgressSchema = z.object({
  completadas: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type TaskProgress = z.infer<typeof taskProgressSchema>;

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
  /** Tareas asignadas al usuario: las que empiezan hoy y su avance de la semana. */
  tareas: z.object({ hoy: z.array(calendarTaskSchema), semana: taskProgressSchema }),
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
  tareasOrganizacion: taskProgressSchema,
});
export type AdminHome = z.infer<typeof adminHomeSchema>;
