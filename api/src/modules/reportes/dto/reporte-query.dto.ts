import { IsOptional, IsUUID } from 'class-validator';
import { REPORTE_MAX_DIAS } from '../../../common/constants/asistencia.constants';
import { EsFecha } from '../../../common/validators/es-fecha.validator';
import { RangoDeFechas } from '../validators/rango-fechas.validator';

/** Query de `GET /organizaciones/{id}/reportes/asistencia`. */
export class ReporteQueryDto {
  @EsFecha({ message: 'La fecha «desde» debe tener el formato AAAA-MM-DD.' })
  desde!: string;

  @EsFecha({ message: 'La fecha «hasta» debe tener el formato AAAA-MM-DD.' })
  @RangoDeFechas('desde', REPORTE_MAX_DIAS)
  hasta!: string;

  /** Para el reporte individual de un miembro. */
  @IsOptional()
  @IsUUID('all', { message: 'El identificador del miembro no es válido.' })
  miembroId?: string;
}
