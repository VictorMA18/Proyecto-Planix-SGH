import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export const FILTROS_EQUIPO = [
  'TODOS',
  'ADMIN',
  'SUPERVISOR',
  'EMPLEADO',
  'PENDIENTES',
] as const;
export type FiltroEquipo = (typeof FILTROS_EQUIPO)[number];

/** Parámetros de `GET /organizaciones/{id}/equipo`. */
export class EquipoQueryDto {
  /** Texto a buscar en el nombre o el correo. */
  @IsOptional()
  @Trim()
  @IsString({ message: 'La búsqueda no es válida.' })
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres.',
  })
  q?: string;

  @IsOptional()
  @IsIn(FILTROS_EQUIPO, { message: 'El filtro no es válido.' })
  filtro: FiltroEquipo = 'TODOS';

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
