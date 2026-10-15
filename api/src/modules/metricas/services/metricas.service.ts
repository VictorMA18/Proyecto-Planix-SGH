import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  JornadaAsistencia,
  MiembroOrganizacion,
  MovimientoAsistencia,
  PlantillaTurno,
  Usuario,
} from '@prisma/client';
import { ROLES_ADMINISTRADORES } from '../../../common/constants/invitaciones.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import {
  duracionTurnoMin,
  minutosDeTimeDb,
} from '../../../common/utils/hora.util';
import { minutosTrabajados } from '../../../common/utils/jornada.util';
import {
  comoFechaDb,
  desdeFechaDb,
  fechaLocal,
  instanteLocal,
  sumarDias,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import {
  ColaboradoresQueryDto,
  MetricasQueryDto,
  PeriodoQueryDto,
} from '../dto/metricas-query.dto';
import {
  MetricasPeriodoResponseDto,
  PaginaColaboradoresResponseDto,
} from '../dto/metricas-response.dto';
import type {
  MarcaQr,
  MetricasCalculadas,
} from '../interfaces/metricas.interface';
import {
  agregarPeriodo,
  buscarColaboradores,
  ordenarColaboradores,
  periodoAnterior,
  rangoDelPeriodo,
  registroDiario,
  resumenColaborador,
  type MiembroCalculo,
} from '../utils/metricas.util';

type MiembroConDatos = MiembroOrganizacion & {
  usuario: Usuario;
  plantillaTurno: PlantillaTurno | null;
};
type JornadaConMovimientos = JornadaAsistencia & {
  movimientos: MovimientoAsistencia[];
};

/**
 * Métricas de la pestaña «Métricas» y datos del reporte exportable, en la zona de la
 * organización. El equipo completo (o las métricas de otro miembro) solo lo ven ADMIN y
 * SUPER_ADMIN; cualquier miembro puede ver las suyas.
 */
@Injectable()
export class MetricasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly reloj: RelojService,
  ) {}

  async metricas(
    usuario: Usuario,
    organizacionId: string,
    query: MetricasQueryDto,
  ): Promise<MetricasPeriodoResponseDto> {
    return MetricasPeriodoResponseDto.desde(
      await this.calcular(usuario, organizacionId, query, query.miembroId),
    );
  }

  async colaboradores(
    usuario: Usuario,
    organizacionId: string,
    query: ColaboradoresQueryDto,
  ): Promise<PaginaColaboradoresResponseDto> {
    const { colaboradores } = await this.calcular(
      usuario,
      organizacionId,
      query,
    );
    return PaginaColaboradoresResponseDto.desde(
      buscarColaboradores(colaboradores ?? [], query.q),
      query.page,
      query.pageSize,
    );
  }

  /**
   * Calcula las métricas del periodo para el equipo (sin `miembroId`) o para un miembro. Lee en
   * una sola consulta las jornadas del periodo y del anterior (para la variación).
   */
  async calcular(
    usuario: Usuario,
    organizacionId: string,
    { periodo, fecha }: PeriodoQueryDto,
    miembroId?: string,
  ): Promise<MetricasCalculadas> {
    const propia = await this.acceso.exigirMiembro(usuario.id, organizacionId);
    const esAdmin = ROLES_ADMINISTRADORES.includes(propia.rol);

    const miembros: MiembroConDatos[] =
      await this.prisma.miembroOrganizacion.findMany({
        where: {
          organizacionId,
          estado: 'ACTIVO',
          ...(miembroId ? { id: miembroId } : {}),
        },
        include: { usuario: true, plantillaTurno: true },
      });
    if (miembroId && miembros.length === 0) {
      throw new NotFoundException('Miembro no encontrado');
    }
    if (!esAdmin && (!miembroId || miembros[0].usuarioId !== usuario.id)) {
      throw new ForbiddenException(
        'Solo un ADMIN puede ver las métricas del equipo o de otro miembro.',
      );
    }

    const organizacion = await this.prisma.organizacion.findUniqueOrThrow({
      where: { id: organizacionId },
      select: { id: true, nombre: true, zonaHoraria: true },
    });
    const ahora = this.reloj.ahora();
    const zona = organizacion.zonaHoraria;
    const hoy = fechaLocal(ahora, zona);
    const rango = rangoDelPeriodo(periodo, fecha);
    const anterior = periodoAnterior(periodo, rango);

    const jornadas: JornadaConMovimientos[] =
      await this.prisma.jornadaAsistencia.findMany({
        where: {
          organizacionId,
          usuarioId: { in: miembros.map((m) => m.usuarioId) },
          fecha: {
            gte: comoFechaDb(anterior.desde),
            lte: comoFechaDb(rango.hasta),
          },
        },
        include: { movimientos: { orderBy: { hora: 'asc' } } },
      });

    const calculo = miembros
      .map((m) => this.aCalculo(m, jornadas, ahora))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const objetivo = miembroId ? calculo[0] : null;
    const enPeriodo = (j: JornadaConMovimientos) => {
      const dia = desdeFechaDb(j.fecha);
      return dia >= rango.desde && dia <= rango.hasta;
    };
    const nombres = new Map(
      miembros.map((m) => [m.usuarioId, m.usuario.nombre]),
    );
    const marcas: MarcaQr[] = jornadas
      .filter(enPeriodo)
      .flatMap((j) =>
        j.movimientos.map((mov) => ({
          nombre: nombres.get(j.usuarioId) ?? '',
          fecha: desdeFechaDb(j.fecha),
          hora: mov.hora,
          tipo: mov.tipo,
        })),
      )
      .sort(
        (a, b) =>
          a.nombre.localeCompare(b.nombre, 'es') ||
          a.hora.getTime() - b.hora.getTime(),
      );

    return {
      organizacion,
      hoy,
      tipo: periodo,
      rango,
      alcance: objetivo ? 'MIEMBRO' : 'EQUIPO',
      miembro: objetivo
        ? {
            miembroId: objetivo.miembroId,
            nombre: objetivo.nombre,
            avatarUrl: objetivo.avatarUrl,
            rol: objetivo.rol,
            turno: objetivo.turno,
          }
        : null,
      miembrosActivos: calculo.length,
      agregado: agregarPeriodo(calculo, periodo, rango, hoy),
      colaboradores: objetivo
        ? null
        : ordenarColaboradores(
            calculo.map((m) => resumenColaborador(m, rango, hoy)),
          ),
      registroDiario: objetivo ? registroDiario(objetivo, rango, hoy) : null,
      tareas: objetivo
        ? await this.tareasDelPeriodo(
            organizacionId,
            miembros[0].usuarioId,
            rango,
            zona,
          )
        : null,
      marcas,
    };
  }

  private aCalculo(
    miembro: MiembroConDatos,
    jornadas: JornadaConMovimientos[],
    ahora: Date,
  ): MiembroCalculo {
    const plantilla = miembro.plantillaTurno;
    return {
      miembroId: miembro.id,
      nombre: miembro.usuario.nombre,
      email: miembro.usuario.email,
      avatarUrl: miembro.usuario.avatarUrl,
      rol: miembro.rol,
      turno: plantilla?.nombre ?? null,
      plantilla: plantilla
        ? {
            dias: plantilla.dias,
            duracionMin: duracionTurnoMin(
              minutosDeTimeDb(plantilla.horaInicio),
              minutosDeTimeDb(plantilla.horaFin),
            ),
          }
        : null,
      jornadas: jornadas
        .filter((j) => j.usuarioId === miembro.usuarioId)
        .map((j) => ({
          fecha: desdeFechaDb(j.fecha),
          minutos: minutosTrabajados(j.movimientos, ahora),
          puntual: j.puntual,
          minutosTarde: j.minutosTarde,
          turnoMin:
            j.turnoInicio && j.turnoFin
              ? Math.round(
                  (j.turnoFin.getTime() - j.turnoInicio.getTime()) / 60_000,
                )
              : null,
          entrada: j.horaInicio,
          salida: j.horaFin,
          escaneos: j.movimientos.map((m) => ({ tipo: m.tipo, hora: m.hora })),
        })),
    };
  }

  /** Tareas asignadas al miembro que empiezan dentro del periodo. */
  private async tareasDelPeriodo(
    organizacionId: string,
    usuarioId: string,
    rango: { desde: string; hasta: string },
    zona: string,
  ) {
    const tareas = await this.prisma.tarea.findMany({
      where: {
        organizacionId,
        asignaciones: { some: { usuarioId } },
        fechaInicio: {
          gte: instanteLocal(rango.desde, 0, zona),
          lt: instanteLocal(sumarDias(rango.hasta, 1), 0, zona),
        },
      },
      select: { estado: true },
    });
    return {
      completadas: tareas.filter((t) => t.estado === 'COMPLETADA').length,
      total: tareas.length,
    };
  }
}
