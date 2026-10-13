import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import {
  DIFUSION_CONTENIDO_MAX,
  DIFUSION_TITULO_MAX,
  DIFUSION_TITULO_MIN,
} from '../../../common/constants/notificaciones.constants';
import { Trim } from '../../../common/decorators/trim.decorator';

/** Cuerpo de `POST /organizaciones/{id}/notificaciones/difusion`. */
export class DifusionDto {
  @Trim()
  @IsString({ message: 'El título no es válido.' })
  @Length(DIFUSION_TITULO_MIN, DIFUSION_TITULO_MAX, {
    message: `El título debe tener entre ${DIFUSION_TITULO_MIN} y ${DIFUSION_TITULO_MAX} caracteres.`,
  })
  titulo!: string;

  @Trim()
  @IsString({ message: 'El mensaje no es válido.' })
  @Length(1, DIFUSION_CONTENIDO_MAX, {
    message: `El mensaje debe tener entre 1 y ${DIFUSION_CONTENIDO_MAX} caracteres.`,
  })
  contenido!: string;

  /** Sin esta lista, el aviso llega a todos los miembros activos. */
  @IsOptional()
  @IsArray({ message: 'Los destinatarios deben ser una lista.' })
  @ArrayMinSize(1, { message: 'Elige al menos a un miembro.' })
  @ArrayUnique({ message: 'Hay miembros repetidos.' })
  @IsUUID('all', {
    each: true,
    message: 'Algún identificador de miembro no es válido.',
  })
  miembroIds?: string[];
}
