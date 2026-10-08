import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MiembroOrganizacion, Usuario } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MiembroResponseDto } from '../../organizaciones/dto/miembro-response.dto';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { CambiarRolDto } from '../dto/cambiar-rol.dto';

/** Ver, cambiar el rol y quitar a los miembros de una organización. */
@Injectable()
export class GestionMiembrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
  ) {}

  /** Cualquier miembro de la organización puede ver el perfil de otro miembro activo. */
  async obtener(
    usuario: Usuario,
    organizacionId: string,
    miembroId: string,
  ): Promise<MiembroResponseDto> {
    await this.acceso.exigirMiembro(usuario.id, organizacionId);
    return MiembroResponseDto.desde(
      await this.buscarActivo(organizacionId, miembroId),
    );
  }

  async cambiarRol(
    usuario: Usuario,
    organizacionId: string,
    miembroId: string,
    { rol }: CambiarRolDto,
  ): Promise<MiembroResponseDto> {
    const solicitante = await this.acceso.exigirAdmin(
      usuario.id,
      organizacionId,
    );
    const objetivo = await this.buscarActivo(organizacionId, miembroId);

    this.validarObjetivo(
      solicitante,
      objetivo,
      'No puedes cambiar tu propio rol.',
    );
    if (objetivo.rol === rol)
      throw new ConflictException('El miembro ya tiene ese rol.');

    const actualizado = await this.prisma.miembroOrganizacion.update({
      where: { id: objetivo.id },
      data: { rol },
      include: { usuario: true },
    });
    return MiembroResponseDto.desde(actualizado);
  }

  /**
   * Quita al miembro del equipo: la membresía pasa a INACTIVO (se conserva el historial) y puede
   * volver con una nueva invitación o código.
   */
  async quitar(
    usuario: Usuario,
    organizacionId: string,
    miembroId: string,
  ): Promise<void> {
    const solicitante = await this.acceso.exigirAdmin(
      usuario.id,
      organizacionId,
    );
    const objetivo = await this.buscarActivo(organizacionId, miembroId);

    this.validarObjetivo(
      solicitante,
      objetivo,
      'No puedes quitarte a ti mismo del equipo.',
    );
    await this.prisma.miembroOrganizacion.update({
      where: { id: objetivo.id },
      data: { estado: 'INACTIVO' },
    });
  }

  /** Siempre dentro de la organización indicada (multi-tenancy): otro tenant responde 404. */
  private async buscarActivo(organizacionId: string, miembroId: string) {
    const miembro = await this.prisma.miembroOrganizacion.findFirst({
      where: { id: miembroId, organizacionId, estado: 'ACTIVO' },
      include: { usuario: true },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');
    return miembro;
  }

  /**
   * Reglas comunes de cambiar rol y quitar: nadie se modifica a sí mismo (así la organización
   * siempre conserva a quien administra) y solo un SUPER_ADMIN toca a otro SUPER_ADMIN.
   */
  private validarObjetivo(
    solicitante: MiembroOrganizacion,
    objetivo: MiembroOrganizacion,
    mensajePropio: string,
  ): void {
    if (objetivo.usuarioId === solicitante.usuarioId)
      throw new ConflictException(mensajePropio);
    if (objetivo.rol === 'SUPER_ADMIN' && solicitante.rol !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo un SUPER_ADMIN puede modificar a otro SUPER_ADMIN',
      );
    }
  }
}
