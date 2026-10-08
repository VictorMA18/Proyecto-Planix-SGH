import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MiembroOrganizacion } from '@prisma/client';
import { ROLES_ADMINISTRADORES } from '../../../common/constants/invitaciones.constants';
import { PrismaService } from '../../../prisma/prisma.service';

/** Comprueba la pertenencia y el rol del usuario en una organización (multi-tenancy y RBAC). */
@Injectable()
export class AccesoOrganizacionService {
  constructor(private readonly prisma: PrismaService) {}

  /** El usuario debe ser miembro ACTIVO; si no, la organización "no existe" para él (404). */
  async exigirMiembro(
    usuarioId: string,
    organizacionId: string,
  ): Promise<MiembroOrganizacion> {
    const membresia = await this.prisma.miembroOrganizacion.findUnique({
      where: { usuarioId_organizacionId: { usuarioId, organizacionId } },
      include: { organizacion: { select: { activa: true } } },
    });

    if (
      !membresia ||
      membresia.estado !== 'ACTIVO' ||
      !membresia.organizacion.activa
    ) {
      throw new NotFoundException('Organización no encontrada');
    }
    return membresia;
  }

  /** Además de ser miembro, debe ser ADMIN (o SUPER_ADMIN) de la organización (403). */
  async exigirAdmin(
    usuarioId: string,
    organizacionId: string,
  ): Promise<MiembroOrganizacion> {
    const membresia = await this.exigirMiembro(usuarioId, organizacionId);
    if (!ROLES_ADMINISTRADORES.includes(membresia.rol)) {
      throw new ForbiddenException('Solo un ADMIN puede realizar esta acción');
    }
    return membresia;
  }
}
