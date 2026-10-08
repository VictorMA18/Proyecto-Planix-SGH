import type {
  EstadoMiembro,
  MiembroOrganizacion,
  Organizacion,
  RolMiembro,
} from '@prisma/client';
import { OrganizacionConMiembrosResponseDto } from './organizacion-response.dto';

/** Pertenencia del usuario autenticado a una organización, con su rol en ella. */
export class MembresiaResponseDto {
  id!: string;
  rol!: RolMiembro;
  estado!: EstadoMiembro;
  fechaIngreso!: Date | null;
  organizacion!: OrganizacionConMiembrosResponseDto;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(
    membresia: MiembroOrganizacion,
    organizacion: Organizacion,
    miembrosActivos: number,
  ): MembresiaResponseDto {
    return Object.assign(new MembresiaResponseDto(), {
      id: membresia.id,
      rol: membresia.rol,
      estado: membresia.estado,
      fechaIngreso: membresia.fechaIngreso,
      organizacion: OrganizacionConMiembrosResponseDto.desdeConConteo(
        organizacion,
        miembrosActivos,
      ),
      createdAt: membresia.createdAt,
      updatedAt: membresia.updatedAt,
    });
  }
}
