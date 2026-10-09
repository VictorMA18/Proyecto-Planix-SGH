import type { EstadoMiembro, RolMiembro } from '@prisma/client';

export class FilaReporteResponseDto {
  miembroId!: string;
  nombre!: string;
  email!: string;
  avatarUrl!: string | null;
  rol!: RolMiembro;
  estado!: EstadoMiembro;
  /** Plantilla asignada hoy (`null` si no tiene). */
  turno!: string | null;
  diasTrabajados!: number;
  minutosTrabajados!: number;
  puntuales!: number;
  tardanzas!: number;
  /** Suma de los minutos de retraso de los días con tardanza. */
  minutosTarde!: number;
}

/** Horas trabajadas y puntualidad por miembro en un rango de fechas. */
export class ReporteAsistenciaResponseDto {
  desde!: string;
  hasta!: string;
  totalMinutos!: number;
  filas!: FilaReporteResponseDto[];
}
