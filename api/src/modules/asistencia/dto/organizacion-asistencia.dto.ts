import { IsUUID } from 'class-validator';

/**
 * Organización sobre la que se opera: cuerpo de `POST /asistencia/salida` y query de
 * `GET /asistencia/hoy`. La hora siempre la pone el servidor.
 */
export class OrganizacionAsistenciaDto {
  @IsUUID('all', {
    message: 'El identificador de la organización no es válido.',
  })
  organizacionId!: string;
}
