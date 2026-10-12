import { IsOptional, IsUUID } from 'class-validator';
import { TAREAS_MAX_DIAS } from '../../../common/constants/tareas.constants';
import { EsFecha } from '../../../common/validators/es-fecha.validator';
import { RangoDeFechas } from '../../../common/validators/rango-fechas.validator';

/** Query de `GET /organizaciones/{id}/tareas`: tareas que empiezan entre `desde` y `hasta` (locales). */
export class TareasQueryDto {
  @EsFecha({ message: 'La fecha «desde» debe tener el formato AAAA-MM-DD.' })
  desde!: string;

  @EsFecha({ message: 'La fecha «hasta» debe tener el formato AAAA-MM-DD.' })
  @RangoDeFechas('desde', TAREAS_MAX_DIAS)
  hasta!: string;

  /** Solo las tareas asignadas a este miembro. */
  @IsOptional()
  @IsUUID('all', { message: 'El identificador del miembro no es válido.' })
  miembroId?: string;
}

/** Query de `GET /me/tareas`. */
export class MisTareasQueryDto {
  @IsUUID('all', {
    message: 'El identificador de la organización no es válido.',
  })
  organizacionId!: string;

  @EsFecha({ message: 'La fecha «desde» debe tener el formato AAAA-MM-DD.' })
  desde!: string;

  @EsFecha({ message: 'La fecha «hasta» debe tener el formato AAAA-MM-DD.' })
  @RangoDeFechas('desde', TAREAS_MAX_DIAS)
  hasta!: string;
}
