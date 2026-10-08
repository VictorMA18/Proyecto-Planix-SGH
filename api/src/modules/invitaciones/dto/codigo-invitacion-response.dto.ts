import type { CodigoInvitacion, RolMiembro } from '@prisma/client';

export class CodigoInvitacionResponseDto {
  codigo!: string;
  rol!: RolMiembro;
  expiraEn!: Date;

  static desde(codigo: CodigoInvitacion): CodigoInvitacionResponseDto {
    return Object.assign(new CodigoInvitacionResponseDto(), {
      codigo: codigo.codigo,
      rol: codigo.rol,
      expiraEn: codigo.expiraEn,
    });
  }
}
