import type { RolMiembro } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, MaxLength } from 'class-validator';
import { ROLES_INVITABLES } from '../../../common/constants/invitaciones.constants';

/** Invitación personal: el código solo lo puede usar la cuenta con ese correo. */
export class CrearInvitacionDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo no es válido.' })
  @MaxLength(255, { message: 'El correo no puede superar los 255 caracteres.' })
  email!: string;

  @IsIn(ROLES_INVITABLES, {
    message: 'El rol debe ser ADMIN, SUPERVISOR o EMPLEADO.',
  })
  rol!: RolMiembro;
}
