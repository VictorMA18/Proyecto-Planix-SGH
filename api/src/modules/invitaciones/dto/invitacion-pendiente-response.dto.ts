import type { Invitacion, RolMiembro } from '@prisma/client';

/** Invitación personal pendiente, tal como se muestra en «Equipo y Miembros». */
export class InvitacionPendienteResponseDto {
  readonly tipo = 'INVITACION' as const;
  id!: string;
  /** Si la persona ya tiene cuenta se muestra su nombre; si no, solo el correo. */
  nombre?: string;
  email!: string;
  rol!: RolMiembro;
  enviadaEn!: Date;
  expiraEn!: Date;

  static desde(
    invitacion: Invitacion,
    nombre?: string,
  ): InvitacionPendienteResponseDto {
    return Object.assign(new InvitacionPendienteResponseDto(), {
      id: invitacion.id,
      nombre,
      email: invitacion.email,
      rol: invitacion.rol,
      // `updatedAt` se renueva al reenviar la invitación.
      enviadaEn: invitacion.updatedAt,
      expiraEn: invitacion.expiraEn,
    });
  }
}
