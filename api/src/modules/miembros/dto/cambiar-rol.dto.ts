import type { RolMiembro } from '@prisma/client';
import { IsIn } from 'class-validator';
import { ROLES_INVITABLES } from '../../../common/constants/invitaciones.constants';

/** Nuevo rol de un miembro (no se puede asignar SUPER_ADMIN desde aquí). */
export class CambiarRolDto {
  @IsIn(ROLES_INVITABLES, {
    message: 'El rol debe ser ADMIN, SUPERVISOR o EMPLEADO.',
  })
  rol!: RolMiembro;
}
