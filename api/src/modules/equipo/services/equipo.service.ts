import { Injectable } from '@nestjs/common';
import type { RolMiembro, Usuario } from '@prisma/client';
import { normalizarTexto } from '../../../common/utils/texto.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { InvitacionPendienteResponseDto } from '../../invitaciones/dto/invitacion-pendiente-response.dto';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { EquipoQueryDto, FiltroEquipo } from '../dto/equipo-query.dto';
import { MiembroEquipoResponseDto } from '../dto/miembro-equipo-response.dto';
import {
  ConteosEquipoResponseDto,
  ItemEquipoResponseDto,
  PaginaEquipoResponseDto,
} from '../dto/pagina-equipo-response.dto';

const PRIORIDAD_ROL: Record<RolMiembro, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  SUPERVISOR: 2,
  EMPLEADO: 3,
};

function coincideFiltro(
  item: ItemEquipoResponseDto,
  filtro: FiltroEquipo,
): boolean {
  switch (filtro) {
    case 'TODOS':
      return true;
    case 'PENDIENTES':
      return item.tipo === 'INVITACION';
    case 'ADMIN':
      return (
        item.tipo === 'MIEMBRO' &&
        (item.rol === 'ADMIN' || item.rol === 'SUPER_ADMIN')
      );
    case 'SUPERVISOR':
      return item.tipo === 'MIEMBRO' && item.rol === 'SUPERVISOR';
    case 'EMPLEADO':
      return item.tipo === 'MIEMBRO' && item.rol === 'EMPLEADO';
  }
}

@Injectable()
export class EquipoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
  ) {}

  /**
   * Miembros activos + invitaciones pendientes de la organización, con búsqueda, filtro y
   * paginación. Primero los miembros (por rol y nombre) y después las invitaciones (más recientes
   * primero). La unión de las dos fuentes se arma en memoria: pensado para equipos de cientos de
   * personas; si crece mucho habrá que pasarlo a una consulta SQL con paginación.
   */
  async listar(
    usuario: Usuario,
    organizacionId: string,
    { q, filtro, page, pageSize }: EquipoQueryDto,
  ): Promise<PaginaEquipoResponseDto> {
    await this.acceso.exigirMiembro(usuario.id, organizacionId);

    const [miembros, invitaciones] = await Promise.all([
      this.prisma.miembroOrganizacion.findMany({
        where: { organizacionId, estado: 'ACTIVO' },
        include: { usuario: true },
      }),
      this.prisma.invitacion.findMany({
        where: {
          organizacionId,
          estado: 'PENDIENTE',
          expiraEn: { gt: new Date() },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Si la persona invitada ya tiene cuenta, se muestra su nombre.
    const cuentas = invitaciones.length
      ? await this.prisma.usuario.findMany({
          where: { email: { in: invitaciones.map((i) => i.email) } },
          select: { email: true, nombre: true },
        })
      : [];
    const nombrePorEmail = new Map(cuentas.map((c) => [c.email, c.nombre]));

    const todos: ItemEquipoResponseDto[] = [
      ...miembros
        .sort(
          (a, b) =>
            PRIORIDAD_ROL[a.rol] - PRIORIDAD_ROL[b.rol] ||
            a.usuario.nombre.localeCompare(b.usuario.nombre, 'es'),
        )
        .map((m) => MiembroEquipoResponseDto.desde(m)),
      ...invitaciones.map((i) =>
        InvitacionPendienteResponseDto.desde(i, nombrePorEmail.get(i.email)),
      ),
    ];

    const consulta = normalizarTexto(q ?? '');
    const filtrados = todos.filter(
      (item) =>
        coincideFiltro(item, filtro) &&
        (!consulta ||
          normalizarTexto(
            item.tipo === 'INVITACION'
              ? (item.nombre ?? item.email)
              : item.nombre,
          ).includes(consulta) ||
          normalizarTexto(item.email).includes(consulta)),
    );

    const inicio = (page - 1) * pageSize;
    return {
      items: filtrados.slice(inicio, inicio + pageSize),
      total: filtrados.length,
      page,
      pageSize,
      conteos: this.contar(todos),
    };
  }

  private contar(items: ItemEquipoResponseDto[]): ConteosEquipoResponseDto {
    const cantidad = (filtro: FiltroEquipo) =>
      items.filter((i) => coincideFiltro(i, filtro)).length;
    return {
      todos: items.length,
      admins: cantidad('ADMIN'),
      supervisores: cantidad('SUPERVISOR'),
      empleados: cantidad('EMPLEADO'),
      pendientes: cantidad('PENDIENTES'),
    };
  }
}
