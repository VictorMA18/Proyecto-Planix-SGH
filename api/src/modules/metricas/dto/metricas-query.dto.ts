import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  COLABORADORES_PAGINA,
  COLABORADORES_PAGINA_MAX,
  FORMATOS_REPORTE,
  TIPOS_PERIODO,
  type FormatoReporte,
  type TipoPeriodo,
} from '../../../common/constants/metricas.constants';
import { Trim } from '../../../common/decorators/trim.decorator';
import { EsFecha } from '../../../common/validators/es-fecha.validator';

/** Periodo pedido: la semana (lunes a domingo) o el mes que contiene `fecha`. */
export class PeriodoQueryDto {
  @IsIn(TIPOS_PERIODO, { message: 'El periodo debe ser SEMANA o MES.' })
  periodo!: TipoPeriodo;

  @EsFecha({ message: 'La fecha debe tener el formato AAAA-MM-DD.' })
  fecha!: string;
}

/** Query de `GET /organizaciones/{id}/metricas`. */
export class MetricasQueryDto extends PeriodoQueryDto {
  /** Métricas individuales; sin él, las del equipo. */
  @IsOptional()
  @IsUUID('all', { message: 'El identificador del miembro no es válido.' })
  miembroId?: string;
}

/** Query de `GET /organizaciones/{id}/metricas/colaboradores`. */
export class ColaboradoresQueryDto extends PeriodoQueryDto {
  @IsOptional()
  @Trim()
  @IsString({ message: 'La búsqueda no es válida.' })
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres.',
  })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1.' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser mayor o igual a 1.' })
  @Max(COLABORADORES_PAGINA_MAX, {
    message: `El tamaño de página no puede superar ${COLABORADORES_PAGINA_MAX}.`,
  })
  pageSize: number = COLABORADORES_PAGINA;
}

/** Query de `GET /organizaciones/{id}/metricas/reporte`. */
export class ReporteMetricasQueryDto extends MetricasQueryDto {
  @IsIn(FORMATOS_REPORTE, { message: 'El formato debe ser PDF o XLSX.' })
  formato!: FormatoReporte;
}
