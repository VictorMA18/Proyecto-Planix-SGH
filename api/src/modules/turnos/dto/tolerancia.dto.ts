import { IsInt, Max, Min } from 'class-validator';
import { TOLERANCIA_MAX_MIN } from '../../../common/constants/asistencia.constants';

/** Cuerpo de `PATCH /organizaciones/{id}/turnos/tolerancia`. */
export class ToleranciaDto {
  @IsInt({ message: 'La tolerancia debe ser un número entero de minutos.' })
  @Min(0, { message: 'La tolerancia no puede ser negativa.' })
  @Max(TOLERANCIA_MAX_MIN, {
    message: `La tolerancia no puede superar los ${TOLERANCIA_MAX_MIN} minutos.`,
  })
  toleranciaMin!: number;
}
