import { Injectable, NotFoundException } from '@nestjs/common';
import type { MovimientoAsistencia, Usuario } from '@prisma/client';
import { RelojService } from '../../../common/reloj/reloj.service';
import { minutosTrabajados } from '../../../common/utils/jornada.util';
import { comoFechaDb } from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { ReporteAsistenciaResponseDto } from '../dto/reporte-asistencia-response.dto';
import { ReporteQueryDto } from '../dto/reporte-query.dto';

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly reloj: RelojService,
  ) {}

  /**
   * Reporte de asistencia (solo ADMIN). Incluye a todos los miembros activos (aunque no hayan
   * trabajado) y a los inactivos que tengan jornadas en el rango.
   */
  async asistencia(
    usuario: Usuario,
    organizacionId: string,
    { desde, hasta, miembroId }: ReporteQueryDto,
  ): Promise<ReporteAsistenciaResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    const ahora = this.reloj.ahora();

    const miembros = await this.prisma.miembroOrganizacion.findMany({
      where: { organizacionId, ...(miembroId ? { id: miembroId } : {}) },
      include: { usuario: true, plantillaTurno: true },
    });
    if (miembroId && miembros.length === 0)
      throw new NotFoundException('Miembro no encontrado');

    const jornadas = await this.prisma.jornadaAsistencia.findMany({
      where: {
        organizacionId,
        usuarioId: { in: miembros.map((m) => m.usuarioId) },
        fecha: { gte: comoFechaDb(desde), lte: comoFechaDb(hasta) },
      },
      include: { movimientos: true },
    });

    const filas = miembros
      .map((miembro) => {
        const propias = jornadas.filter(
          (j) => j.usuarioId === miembro.usuarioId,
        );
        const tarde = propias.filter((j) => j.puntual === false);
        return {
          miembroId: miembro.id,
          nombre: miembro.usuario.nombre,
          email: miembro.usuario.email,
          avatarUrl: miembro.usuario.avatarUrl,
          rol: miembro.rol,
          estado: miembro.estado,
          turno: miembro.plantillaTurno?.nombre ?? null,
          diasTrabajados: propias.length,
          minutosTrabajados: this.calcularHorasTrabajadas(propias, ahora),
          puntuales: propias.filter((j) => j.puntual === true).length,
          tardanzas: tarde.length,
          minutosTarde: tarde.reduce(
            (suma, j) => suma + (j.minutosTarde ?? 0),
            0,
          ),
        };
      })
      .filter((fila) => fila.estado === 'ACTIVO' || fila.diasTrabajados > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return Object.assign(new ReporteAsistenciaResponseDto(), {
      desde,
      hasta,
      totalMinutos: filas.reduce((suma, f) => suma + f.minutosTrabajados, 0),
      filas,
    });
  }

  /** Minutos trabajados en varias jornadas: tramos ENTRADA → SALIDA emparejados en código. */
  calcularHorasTrabajadas(
    jornadas: { movimientos: MovimientoAsistencia[] }[],
    ahora: Date,
  ): number {
    return jornadas.reduce(
      (suma, j) => suma + minutosTrabajados(j.movimientos, ahora),
      0,
    );
  }
}
