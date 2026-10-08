import type {
  EstadoMiembro,
  MiembroOrganizacion,
  RolMiembro,
  Usuario,
} from '@prisma/client';

/** Miembro de la organización, tal como se muestra en «Equipo y Miembros». */
export class MiembroEquipoResponseDto {
  readonly tipo = 'MIEMBRO' as const;
  id!: string;
  nombre!: string;
  email!: string;
  avatarUrl!: string | null;
  rol!: RolMiembro;
  estado!: EstadoMiembro;

  static desde(
    miembro: MiembroOrganizacion & { usuario: Usuario },
  ): MiembroEquipoResponseDto {
    return Object.assign(new MiembroEquipoResponseDto(), {
      id: miembro.id,
      nombre: miembro.usuario.nombre,
      email: miembro.usuario.email,
      avatarUrl: miembro.usuario.avatarUrl,
      rol: miembro.rol,
      estado: miembro.estado,
    });
  }
}
