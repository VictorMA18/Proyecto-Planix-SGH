import { z } from 'zod';

// Esquemas de la pestaña «Inicio». Las formas coinciden con los contratos proyectados en
// api/openapi.yaml (InicioEmpleado, PanelAdmin y TareaInicio). Dependen de asistencia (Fase 2) y
// tareas (Fase 3): por ahora los datos son de ejemplo.

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

export const employeeHomeSchema = z.object({
  turno: z.object({
    nombre: z.string(),
    inicio: z.iso.datetime(),
    fin: z.iso.datetime(),
  }),
  estado: z.enum(['DENTRO', 'FUERA']),
  entrada: z
    .object({
      registradaEn: z.iso.datetime(),
      puntual: z.boolean(),
      minutosTarde: z.number().int().min(0),
    })
    .nullable(),
  semana: z.object({
    horas: z.object({ total: z.number().min(0), variacionPct: z.number() }),
    puntualidad: z.number().min(0).max(100),
    tareas: countOf,
  }),
  tareasHoy: z.array(homeTaskSchema),
});
export type EmployeeHome = z.infer<typeof employeeHomeSchema>;

export const adminHomeSchema = z.object({
  qr: z.object({ expiraEn: z.iso.datetime() }),
  presencia: z.object({
    presentes: z.number().int().min(0),
    esperados: z.number().int().min(0),
    puntuales: z.number().int().min(0),
    retrasos: z.number().int().min(0),
    pendientes: z.number().int().min(0),
  }),
  tareasOrganizacion: countOf,
  puntualidadSemanal: z.object({
    promedio: z.number().min(0).max(100),
    dias: z.array(z.object({ dia: z.string(), valor: z.number().min(0).max(100).nullable() })),
  }),
  asistenciasRecientes: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      area: z.string(),
      hora: z.iso.datetime(),
      estado: z.enum(['PUNTUAL', 'TARDE']),
      minutosTarde: z.number().int().min(0),
    }),
  ),
});
export type AdminHome = z.infer<typeof adminHomeSchema>;
