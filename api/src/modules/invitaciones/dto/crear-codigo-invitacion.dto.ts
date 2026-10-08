import type { RolMiembro } from '@prisma/client';
import { IsIn } from 'class-validator';
import {
  ROLES_INVITABLES,
  VIGENCIAS_CODIGO_MINUTOS,
} from '../../../common/constants/invitaciones.constants';

/** Código genérico: lo puede usar cualquier persona y entra con `rol` hasta que expire. */
export class CrearCodigoInvitacionDto {
  @IsIn(ROLES_INVITABLES, {
    message: 'El rol debe ser ADMIN, SUPERVISOR o EMPLEADO.',
  })
  rol!: RolMiembro;

  @IsIn(VIGENCIAS_CODIGO_MINUTOS, {
    message: 'La vigencia debe ser de 5, 10 o 15 minutos.',
  })
  vigenciaMinutos!: number;
}
