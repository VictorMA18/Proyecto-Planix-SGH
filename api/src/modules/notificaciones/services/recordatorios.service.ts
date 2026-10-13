import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECORDATORIO_ANTICIPACION_MIN } from '../../../common/constants/notificaciones.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import { horaDeMinutos } from '../../../common/utils/hora.util';
import {
  plantillaBasica,
  turnoDelDia,
} from '../../../common/utils/jornada.util';
import {
  comoFechaDb,
  fechaLocal,
  minutosLocales,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  dentroDeLosProximos,
  recordatorioEntrada,
  recordatorioSalida,
} from '../utils/mensajes.util';
import { NotificacionesService } from './notificaciones.service';

/**
 * Recordatorios de fichaje, cada minuto: 15 min antes del inicio del turno a quien aún no entró, y
 * 15 min antes del fin a quien sigue dentro. Cada uno sale una sola vez y respeta la preferencia
 * «Recordatorios de fichaje».
 */
@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: RelojService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'recordatorios-fichaje' })
  async ejecutar(): Promise<void> {
    const ahora = this.reloj.ahora();
    try {
      await this.entradas(ahora);
      await this.salidas(ahora);
    } catch (error) {
      this.logger.error(`Fallaron los recordatorios: ${String(error)}`);
    }
  }

  private async entradas(ahora: Date) {
    const miembros = await this.prisma.miembroOrganizacion.findMany({
      where: {
        estado: 'ACTIVO',
        plantillaTurnoId: { not: null },
        organizacion: { activa: true },
      },
      include: { plantillaTurno: true, organizacion: true },
    });

    for (const miembro of miembros) {
      const zona = miembro.organizacion.zonaHoraria;
      const fecha = fechaLocal(ahora, zona);
      const turno = turnoDelDia(
        plantillaBasica(miembro.plantillaTurno!),
        fecha,
        zona,
      );
      if (
        !turno ||
        !dentroDeLosProximos(turno.inicio, ahora, RECORDATORIO_ANTICIPACION_MIN)
      ) {
        continue;
      }

      const [jornada, enviado] = await Promise.all([
        this.prisma.jornadaAsistencia.findUnique({
          where: {
            usuarioId_organizacionId_fecha: {
              usuarioId: miembro.usuarioId,
              organizacionId: miembro.organizacionId,
              fecha: comoFechaDb(fecha),
            },
          },
          select: { id: true },
        }),
        this.yaEnviado('RECORDATORIO_ENTRADA', miembro.usuarioId, {
          organizacionId: miembro.organizacionId,
          datos: { path: ['fecha'], equals: fecha },
        }),
      ]);
      if (jornada || enviado) continue;

      const mensaje = recordatorioEntrada(
        turno.nombre,
        horaDeMinutos(minutosLocales(turno.inicio, zona)),
      );
      await this.notificaciones.notificar({
        organizacionId: miembro.organizacionId,
        tipo: 'RECORDATORIO_ENTRADA',
        ...mensaje,
        datos: { fecha },
        usuarioIds: [miembro.usuarioId],
        filtro: 'recordatoriosFichaje',
      });
    }
  }

  private async salidas(ahora: Date) {
    const limite = new Date(
      ahora.getTime() + RECORDATORIO_ANTICIPACION_MIN * 60_000,
    );
    const jornadas = await this.prisma.jornadaAsistencia.findMany({
      where: { estadoActual: 'DENTRO', turnoFin: { gt: ahora, lte: limite } },
      include: { organizacion: true },
    });

    for (const jornada of jornadas) {
      if (
        await this.yaEnviado('RECORDATORIO_SALIDA', jornada.usuarioId, {
          referenciaId: jornada.id,
        })
      ) {
        continue;
      }
      const mensaje = recordatorioSalida(
        jornada.turnoNombre ?? 'turno',
        horaDeMinutos(
          minutosLocales(jornada.turnoFin!, jornada.organizacion.zonaHoraria),
        ),
      );
      await this.notificaciones.notificar({
        organizacionId: jornada.organizacionId,
        tipo: 'RECORDATORIO_SALIDA',
        ...mensaje,
        referenciaId: jornada.id,
        usuarioIds: [jornada.usuarioId],
        filtro: 'recordatoriosFichaje',
      });
    }
  }

  private async yaEnviado(
    tipo: 'RECORDATORIO_ENTRADA' | 'RECORDATORIO_SALIDA',
    usuarioId: string,
    filtro: object,
  ): Promise<boolean> {
    const existente = await this.prisma.notificacion.findFirst({
      where: { tipo, destinatarios: { some: { usuarioId } }, ...filtro },
      select: { id: true },
    });
    return !!existente;
  }
}
