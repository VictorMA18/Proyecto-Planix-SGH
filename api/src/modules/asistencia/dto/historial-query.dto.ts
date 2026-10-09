import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { EsFecha } from '../../../common/validators/es-fecha.validator';
import { OrganizacionAsistenciaDto } from './organizacion-asistencia.dto';

/** Query de `GET /asistencia/historial`. */
export class HistorialQueryDto extends OrganizacionAsistenciaDto {
  @IsOptional()
  @EsFecha({ message: 'La fecha «desde» debe tener el formato AAAA-MM-DD.' })
  desde?: string;

  @IsOptional()
  @EsFecha({ message: 'La fecha «hasta» debe tener el formato AAAA-MM-DD.' })
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1.' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser mayor o igual a 1.' })
  @Max(100, { message: 'El tamaño de página no puede superar 100.' })
  pageSize: number = 20;
}
