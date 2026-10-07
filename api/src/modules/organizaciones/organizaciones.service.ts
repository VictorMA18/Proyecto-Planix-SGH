import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearOrganizacionData, slugify } from './organizaciones.validation';

const MAX_INTENTOS_SLUG = 5;

@Injectable()
export class OrganizacionesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Membresías activas del usuario, cada una con su organización y el conteo de miembros activos. */
  async listarMembresias(usuarioId: string) {
    const membresias = await this.prisma.miembroOrganizacion.findMany({
      where: { usuarioId, estado: 'ACTIVO', organizacion: { activa: true } },
      include: {
        organizacion: {
          include: {
            _count: { select: { miembros: { where: { estado: 'ACTIVO' } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return membresias.map(({ organizacion, usuarioId: _u, organizacionId: _o, ...membresia }) => {
      const { _count, activa: _activa, ...datosOrganizacion } = organizacion;
      return {
        ...membresia,
        organizacion: { ...datosOrganizacion, miembrosActivos: _count.miembros },
      };
    });
  }

  /** Crea la organización y deja al creador como ADMIN activo, en una sola operación atómica. */
  async crear(usuarioId: string, { nombre, zonaHoraria }: CrearOrganizacionData) {
    const base = slugify(nombre);

    for (let intento = 0; intento < MAX_INTENTOS_SLUG; intento++) {
      const slug = intento === 0 ? base : `${base.slice(0, 150)}-${randomBytes(2).toString('hex')}`;
      try {
        return await this.prisma.organizacion.create({
          data: {
            nombre,
            slug,
            zonaHoraria,
            miembros: {
              create: { usuarioId, rol: 'ADMIN', estado: 'ACTIVO', fechaIngreso: new Date() },
            },
          },
        });
      } catch (err) {
        const esSlugDuplicado =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (!esSlugDuplicado) throw err;
      }
    }
    throw new Error('No se pudo generar un identificador único para la organización');
  }
}
