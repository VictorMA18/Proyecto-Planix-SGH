import { IsUUID } from 'class-validator';

/** Parámetro de ruta `:organizacionId`. */
export class OrganizacionIdParamDto {
  @IsUUID('all', {
    message: 'El identificador de la organización no es válido.',
  })
  organizacionId!: string;
}
