import { IsUUID } from 'class-validator';

/** Parámetro de ruta `:invitacionId`. */
export class InvitacionIdParamDto {
  @IsUUID('all', { message: 'El identificador de la invitación no es válido.' })
  invitacionId!: string;
}
