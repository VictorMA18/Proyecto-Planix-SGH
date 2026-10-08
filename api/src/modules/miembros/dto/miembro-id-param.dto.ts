import { IsUUID } from 'class-validator';

/** Parámetros de ruta `:organizacionId` y `:miembroId` (id de la membresía). */
export class MiembroIdParamDto {
  @IsUUID('all', {
    message: 'El identificador de la organización no es válido.',
  })
  organizacionId!: string;

  @IsUUID('all', { message: 'El identificador del miembro no es válido.' })
  miembroId!: string;
}
