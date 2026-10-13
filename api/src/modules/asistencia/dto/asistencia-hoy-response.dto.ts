import { PlantillaTurnoResponseDto } from '../../turnos/dto/configuracion-turnos-response.dto';
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
  /** Plantilla asignada al miembro (días y equipo), visible para cualquier rol. */
  plantilla!: PlantillaTurnoResponseDto | null;
  jornada!: JornadaResponseDto | null;
  /** Hora del servidor con la que se calcularon los minutos trabajados. */
  calculadoEn!: Date;
}
