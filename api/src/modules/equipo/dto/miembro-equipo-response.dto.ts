import type {
  EstadoMiembro,
  MiembroOrganizacion,
  PlantillaTurno,
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
  /** Plantilla de turno asignada. */
  turno!: string | null;
  /** Hora de su última entrada, si está dentro ahora. */
  enTurnoDesde!: Date | null;

  static desde(
    miembro: MiembroOrganizacion & {
      usuario: Usuario;
      plantillaTurno: PlantillaTurno | null;
    },
    enTurnoDesde: Date | null = null,
  ): MiembroEquipoResponseDto {
    return Object.assign(new MiembroEquipoResponseDto(), {
      id: miembro.id,
      nombre: miembro.usuario.nombre,
      email: miembro.usuario.email,
      avatarUrl: miembro.usuario.avatarUrl,
      rol: miembro.rol,
      estado: miembro.estado,
      turno: miembro.plantillaTurno?.nombre ?? null,
      enTurnoDesde,
    });
  }
}
