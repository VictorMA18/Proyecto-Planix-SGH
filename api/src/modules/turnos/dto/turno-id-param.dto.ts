import { IsUUID } from 'class-validator';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';

/** Parámetros de ruta `:organizacionId/turnos/:turnoId`. */
export class TurnoIdParamDto extends OrganizacionIdParamDto {
  @IsUUID('all', { message: 'El identificador de la plantilla no es válido.' })
  turnoId!: string;
}
