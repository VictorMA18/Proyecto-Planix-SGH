import { JornadaResponseDto } from './jornada-response.dto';

export class TurnoHoyResponseDto {
  nombre!: string;
  inicio!: Date;
  fin!: Date;
  /** Minutos que dura el turno. */
  objetivoMin!: number;
}

/** `GET /asistencia/hoy`: turno de hoy, tolerancia y jornada (o `null` si aún no marcó entrada). */
export class AsistenciaHoyResponseDto {
  fecha!: string;
  toleranciaMin!: number;
  turno!: TurnoHoyResponseDto | null;
  jornada!: JornadaResponseDto | null;
  /** Hora del servidor con la que se calcularon los minutos trabajados. */
  calculadoEn!: Date;
}
