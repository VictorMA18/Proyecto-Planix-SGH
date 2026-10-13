import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BANDEJA_PAGINA } from '../../../common/constants/notificaciones.constants';

/** `?leida=true|false` llega como texto: se convierte a booleano (otro valor queda inválido). */
const aBooleano = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

/** Organización por la que se filtra la bandeja (opcional). */
export class OrganizacionOpcionalQueryDto {
  @IsOptional()
  @IsUUID('all', {
    message: 'El identificador de la organización no es válido.',
  })
  organizacionId?: string;
}

/** Query de `GET /notificaciones`. */
export class NotificacionesQueryDto extends OrganizacionOpcionalQueryDto {
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean({ message: '«leida» debe ser true o false.' })
  leida?: boolean;

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
  pageSize: number = BANDEJA_PAGINA;
}

/** Parámetro de ruta `:notificacionId` (id del registro del destinatario). */
export class NotificacionIdParamDto {
  @IsUUID('all', {
    message: 'El identificador de la notificación no es válido.',
  })
  notificacionId!: string;
}
