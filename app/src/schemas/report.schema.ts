import { z } from 'zod';

// Reporte de asistencia (ADMIN). Coincide con ReporteAsistencia de api/openapi.yaml.

export const reportRowSchema = z.object({
  miembroId: z.string(),
  nombre: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLEADO']),
  estado: z.enum(['ACTIVO', 'INVITADO', 'INACTIVO']),
  turno: z.string().nullable(),
  diasTrabajados: z.number().int().min(0),
  minutosTrabajados: z.number().int().min(0),
  puntuales: z.number().int().min(0),
  tardanzas: z.number().int().min(0),
  minutosTarde: z.number().int().min(0),
});
export type ReportRow = z.infer<typeof reportRowSchema>;

export const attendanceReportSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  totalMinutos: z.number().int().min(0),
  filas: z.array(reportRowSchema),
});
export type AttendanceReport = z.infer<typeof attendanceReportSchema>;

/** Rangos rápidos del reporte. */
export const reportRangeSchema = z.enum(['ESTA_SEMANA', 'SEMANA_PASADA', 'ESTE_MES']);
export type ReportRange = z.infer<typeof reportRangeSchema>;
