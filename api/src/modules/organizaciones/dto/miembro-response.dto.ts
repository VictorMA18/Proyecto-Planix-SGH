import type {
  EstadoMiembro,
  MiembroOrganizacion,
  RolMiembro,
  Usuario,
} from '@prisma/client';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';

/** Miembro de una organización con los datos de su usuario. */
export class MiembroResponseDto {
  id!: string;
  usuario!: UsuarioResponseDto;
  rol!: RolMiembro;
  estado!: EstadoMiembro;
  fechaIngreso!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(
    miembro: MiembroOrganizacion & { usuario: Usuario },
  ): MiembroResponseDto {
    return Object.assign(new MiembroResponseDto(), {
      id: miembro.id,
      usuario: UsuarioResponseDto.desde(miembro.usuario),
      rol: miembro.rol,
      estado: miembro.estado,
      fechaIngreso: miembro.fechaIngreso,
      createdAt: miembro.createdAt,
      updatedAt: miembro.updatedAt,
    });
  }
}
