import type { EstadoInvitacion, Invitacion, RolMiembro } from '@prisma/client';

export class InvitacionResponseDto {
  id!: string;
  email!: string;
  rol!: RolMiembro;
  estado!: EstadoInvitacion;
  expiraEn!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(invitacion: Invitacion): InvitacionResponseDto {
    return Object.assign(new InvitacionResponseDto(), {
      id: invitacion.id,
      email: invitacion.email,
      rol: invitacion.rol,
      estado: invitacion.estado,
      expiraEn: invitacion.expiraEn,
      createdAt: invitacion.createdAt,
      updatedAt: invitacion.updatedAt,
    });
  }
}

/** Respuesta al crear: incluye el `token` que se comparte con el invitado (solo lo ve quien invita). */
export class InvitacionCreadaResponseDto extends InvitacionResponseDto {
  token!: string;

  static desdeCreada(invitacion: Invitacion): InvitacionCreadaResponseDto {
    return Object.assign(
      new InvitacionCreadaResponseDto(),
      InvitacionResponseDto.desde(invitacion),
      {
        token: invitacion.token,
      },
    );
  }
}
