import type { EstadoJornada } from '@prisma/client';
import { TurnoHoyResponseDto } from '../../asistencia/dto/asistencia-hoy-response.dto';

export class EntradaInicioResponseDto {
  registradaEn!: Date;
  /** `null` si ese día no tenía turno. */
  puntual!: boolean | null;
  minutosTarde!: number | null;
}

export class SemanaInicioResponseDto {
  /** De lunes a hoy. */
  minutosTrabajados!: number;
  diasTrabajados!: number;
  /** Frente al mismo tramo de la semana anterior; `null` si entonces no trabajó. */
  variacionPct!: number | null;
  /** % de días puntuales entre los días con turno; `null` si no hubo ninguno. */
  puntualidad!: number | null;
}

/** `GET /organizaciones/{id}/inicio/mio`: la jornada de hoy y la semana del usuario. */
export class InicioMioResponseDto {
  fecha!: string;
  toleranciaMin!: number;
  turno!: TurnoHoyResponseDto | null;
  estado!: EstadoJornada;
  entrada!: EntradaInicioResponseDto | null;
  /** Trabajado hoy hasta `calculadoEn` (la app suma el tiempo que pasa si está DENTRO). */
  minutosTrabajados!: number;
  calculadoEn!: Date;
  semana!: SemanaInicioResponseDto;
}
