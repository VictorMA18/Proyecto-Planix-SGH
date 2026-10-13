import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { ROLES_SUPERVISION } from '../../../common/constants/notificaciones.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import {
  duracionTurnoMin,
  horaDeTimeDb,
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
import { ResumenMiembroResponseDto } from '../dto/resumen-miembro-response.dto';
import {
  desdeParaMetricas,
  metricasDelMes,
  ultimoDiaDelMes,
} from '../utils/resumen-miembro.util';

/**
 * Credencial y métricas del mes de un miembro, en la zona de la organización. Lo ven ADMIN,
 * SUPER_ADMIN, SUPERVISOR y el propio miembro.
 */
@Injectable()
export class ResumenMiembroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly reloj: RelojService,
  ) {}

  async resumen(
    usuario: Usuario,
    organizacionId: string,
    miembroId: string,
  ): Promise<ResumenMiembroResponseDto> {
    const propia = await this.acceso.exigirMiembro(usuario.id, organizacionId);
    const miembro = await this.prisma.miembroOrganizacion.findFirst({
      where: { id: miembroId, organizacionId, estado: 'ACTIVO' },
      include: { plantillaTurno: true, organizacion: true },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');
    if (
      miembro.usuarioId !== usuario.id &&
      !ROLES_SUPERVISION.includes(propia.rol)
    ) {
      throw new ForbiddenException(
        'Solo un ADMIN o SUPERVISOR puede ver las métricas de otro miembro.',
      );
    }

    const ahora = this.reloj.ahora();
    const zona = miembro.organizacion.zonaHoraria;
    const hoy = fechaLocal(ahora, zona);
    const inicioMes = `${hoy.slice(0, 7)}-01`;

    const [jornadas, tareas] = await Promise.all([
      this.prisma.jornadaAsistencia.findMany({
        where: {
          usuarioId: miembro.usuarioId,
          organizacionId,
          fecha: {
            gte: comoFechaDb(desdeParaMetricas(hoy)),
            lte: comoFechaDb(hoy),
          },
        },
        include: { movimientos: true },
      }),
      this.prisma.tarea.findMany({
        where: {
          organizacionId,
          asignaciones: { some: { usuarioId: miembro.usuarioId } },
          fechaInicio: {
            gte: instanteLocal(inicioMes, 0, zona),
            lt: instanteLocal(sumarDias(ultimoDiaDelMes(hoy), 1), 0, zona),
          },
        },
        select: { estado: true },
      }),
    ]);

    const plantilla = miembro.plantillaTurno;
    const metricas = metricasDelMes(
      hoy,
      jornadas.map((j) => ({
        fecha: desdeFechaDb(j.fecha),
        puntual: j.puntual,
        minutosTrabajados: minutosTrabajados(j.movimientos, ahora),
      })),
      plantilla
        ? {
            dias: plantilla.dias,
            objetivoMin: duracionTurnoMin(
              minutosDeTimeDb(plantilla.horaInicio),
              minutosDeTimeDb(plantilla.horaFin),
            ),
          }
        : null,
    );

    return ResumenMiembroResponseDto.desde({
      metricas,
      turno: plantilla
        ? {
            nombre: plantilla.nombre,
            horaInicio: horaDeTimeDb(plantilla.horaInicio),
            horaFin: horaDeTimeDb(plantilla.horaFin),
          }
        : null,
      entradaHoy:
        jornadas.find((j) => desdeFechaDb(j.fecha) === hoy)?.horaInicio ?? null,
      tareas: {
        completadas: tareas.filter((t) => t.estado === 'COMPLETADA').length,
        total: tareas.length,
      },
    });
  }
}
