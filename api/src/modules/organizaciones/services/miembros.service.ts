import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma, RolMiembro } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MiembrosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activa al usuario en la organización con el rol indicado (crea la membresía o reactiva una
   * existente). Acepta un cliente de transacción para hacerlo junto a otras escrituras.
   */
  async activar(
    usuarioId: string,
    organizacionId: string,
    rol: RolMiembro,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const clave = { usuarioId_organizacionId: { usuarioId, organizacionId } };
    const existente = await db.miembroOrganizacion.findUnique({ where: clave });
    if (existente?.estado === 'ACTIVO') {
      throw new ConflictException('Ya eres miembro de esta organización');
    }

    const datos = { rol, estado: 'ACTIVO' as const, fechaIngreso: new Date() };
    return db.miembroOrganizacion.upsert({
      where: clave,
      create: { usuarioId, organizacionId, ...datos },
      update: datos,
      include: { usuario: true },
    });
  }
}
