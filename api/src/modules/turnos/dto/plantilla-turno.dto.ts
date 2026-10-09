import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import { EsHora } from '../validators/es-hora.validator';

/** Cuerpo de `POST /organizaciones/{id}/turnos` y `PATCH …/turnos/{turnoId}` (reemplazo completo). */
export class PlantillaTurnoDto {
  @Trim()
  @IsString({ message: 'El nombre no es válido.' })
  @Length(2, 60, { message: 'El nombre debe tener entre 2 y 60 caracteres.' })
  nombre!: string;

  @EsHora({ message: 'La hora de inicio debe tener el formato HH:mm.' })
  horaInicio!: string;

  /** Si es menor que `horaInicio`, el turno cruza la medianoche. */
  @EsHora({ message: 'La hora de fin debe tener el formato HH:mm.' })
  horaFin!: string;

  /** 1 = lunes … 7 = domingo. */
  @IsArray({ message: 'Los días deben ser una lista.' })
  @ArrayMinSize(1, { message: 'Elige al menos un día.' })
  @ArrayMaxSize(7, { message: 'Una semana tiene 7 días.' })
  @ArrayUnique({ message: 'Hay días repetidos.' })
  @IsInt({ each: true, message: 'Cada día debe ser un número del 1 al 7.' })
  @Min(1, { each: true, message: 'Cada día debe ser un número del 1 al 7.' })
  @Max(7, { each: true, message: 'Cada día debe ser un número del 1 al 7.' })
  dias!: number[];

  /** Miembros asignados (reemplaza la lista anterior). Quien estaba en otra plantilla pasa a esta. */
  @IsArray({ message: 'Los miembros deben ser una lista.' })
  @ArrayMaxSize(1000, { message: 'Demasiados miembros en una sola plantilla.' })
  @ArrayUnique({ message: 'Hay miembros repetidos.' })
  @IsUUID('all', {
    each: true,
    message: 'Algún identificador de miembro no es válido.',
  })
  miembroIds!: string[];
}
