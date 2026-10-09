import { ForbiddenException, Injectable } from '@nestjs/common';
import type { JornadaAsistencia, Usuario } from '@prisma/client';
import { ROLES_CON_PANEL } from '../../../common/constants/asistencia.constants';
import { ROLES_ADMINISTRADORES } from '../../../common/constants/invitaciones.constants';
import {
  minutosTrabajados,
  plantillaBasica,
  porcentaje,
  turnoDelDia,
} from '../../../common/utils/jornada.util';
import {
  comoFechaDb,
  desdeFechaDb,
  lunesDe,
  sumarDias,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { JornadasService } from '../../asistencia/services/jornadas.service';
import { QrService } from '../../qr/services/qr.service';
import { InicioMioResponseDto } from '../dto/inicio-mio-response.dto';
import { PanelResponseDto } from '../dto/panel-response.dto';

const DIAS_LABORABLES = ['L', 'M', 'X', 'J', 'V'];
const RECIENTES = 4;

const contarPuntualidad = (jornadas: Pick<JornadaAsistencia, 'puntual'>[]) => {
  const conTurno = jornadas.filter((j) => j.puntual !== null);
  return porcentaje(conTurno.filter((j) => j.puntual).length, conTurno.length);
};

@Injectable()
export class InicioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jornadas: JornadasService,
    private readonly qr: QrService,
  ) {}

  /** Inicio de cualquier rol: jornada de hoy, turno y resumen de la semana. */
  async mio(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<InicioMioResponseDto> {
    const ctx = await this.jornadas.contexto(usuario.id, organizacionId);
    const { ahora, fecha } = ctx;
    const jornada = await this.jornadas.jornadaActual(
      usuario.id,
      organizacionId,
      fecha,
    );

    const lunes = lunesDe(fecha);
    const semanaDe = (desde: string, hasta: string) =>
      this.prisma.jornadaAsistencia.findMany({
        where: {
          usuarioId: usuario.id,
          organizacionId,
          fecha: { gte: comoFechaDb(desde), lte: comoFechaDb(hasta) },
        },
        include: { movimientos: true },
      });
    const [actual, anterior] = await Promise.all([
      semanaDe(lunes, fecha),
      semanaDe(sumarDias(lunes, -7), sumarDias(fecha, -7)),
    ]);
    const total = (lista: typeof actual) =>
      lista.reduce(
        (suma, j) => suma + minutosTrabajados(j.movimientos, ahora),
        0,
      );
    const minutosSemana = total(actual);
    const minutosAnterior = total(anterior);
    const primeraEntrada = jornada?.movimientos.find(
      (m) => m.tipo === 'ENTRADA',
    );

    return Object.assign(new InicioMioResponseDto(), {
      fecha,
      toleranciaMin: ctx.organizacion.toleranciaEntradaMin,
      turno: this.jornadas.turnoVigente(ctx, jornada),
      estado: jornada?.estadoActual ?? 'FUERA',
      entrada: primeraEntrada
        ? {
            registradaEn: primeraEntrada.hora,
            puntual: jornada!.puntual,
            minutosTarde: jornada!.minutosTarde,
          }
        : null,
      minutosTrabajados: jornada
        ? minutosTrabajados(jornada.movimientos, ahora)
        : 0,
      calculadoEn: ahora,
      semana: {
        minutosTrabajados: minutosSemana,
        diasTrabajados: actual.length,
        variacionPct:
          minutosAnterior > 0
            ? Math.round(
                ((minutosSemana - minutosAnterior) / minutosAnterior) * 1000,
              ) / 10
            : null,
        puntualidad: contarPuntualidad(actual),
      },
    });
  }

  /** Panel de presencia del equipo: ADMIN y SUPERVISOR. El QR solo lo recibe el ADMIN. */
  async panel(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<PanelResponseDto> {
    const ctx = await this.jornadas.contexto(usuario.id, organizacionId);
    const rol = ctx.membresia.rol;
    if (!(ROLES_CON_PANEL as readonly string[]).includes(rol)) {
      throw new ForbiddenException(
        'Solo un ADMIN o SUPERVISOR puede ver la presencia del equipo',
      );
    }
    const { organizacion, fecha } = ctx;
    const lunes = lunesDe(fecha);

    const [miembros, semana] = await Promise.all([
      this.prisma.miembroOrganizacion.findMany({
        where: { organizacionId, estado: 'ACTIVO' },
        include: { plantillaTurno: true },
      }),
      this.prisma.jornadaAsistencia.findMany({
        where: {
          organizacionId,
          fecha: { gte: comoFechaDb(lunes), lte: comoFechaDb(fecha) },
        },
        include: { usuario: true },
        orderBy: { horaInicio: 'desc' },
      }),
    ]);
    const deHoy = semana.filter((j) => desdeFechaDb(j.fecha) === fecha);
    const conJornadaHoy = new Set(deHoy.map((j) => j.usuarioId));
    const esperados = miembros.filter(
      (m) =>
        m.plantillaTurno &&
        turnoDelDia(
          plantillaBasica(m.plantillaTurno),
          fecha,
          organizacion.zonaHoraria,
        ),
    );
    const miembroDe = new Map(miembros.map((m) => [m.usuarioId, m.id]));

    const dias = DIAS_LABORABLES.map((dia, i) => {
      const dDia = sumarDias(lunes, i);
      return {
        dia,
        fecha: dDia,
        valor:
          dDia > fecha
            ? null
            : contarPuntualidad(
                semana.filter((j) => desdeFechaDb(j.fecha) === dDia),
              ),
      };
    });

    return Object.assign(new PanelResponseDto(), {
      fecha,
      qr: ROLES_ADMINISTRADORES.includes(rol)
        ? await this.qr.generar(organizacion, usuario.id)
        : null,
      presencia: {
        esperados: esperados.length,
        presentes: deHoy.filter((j) => j.estadoActual === 'DENTRO').length,
        puntuales: deHoy.filter((j) => j.puntual === true).length,
        retrasos: deHoy.filter((j) => j.puntual === false).length,
        pendientes: esperados.filter((m) => !conJornadaHoy.has(m.usuarioId))
          .length,
      },
      puntualidadSemanal: { promedio: contarPuntualidad(semana), dias },
      asistenciasRecientes: deHoy.slice(0, RECIENTES).map((j) => ({
        id: j.id,
        miembroId: miembroDe.get(j.usuarioId) ?? null,
        nombre: j.usuario.nombre,
        avatarUrl: j.usuario.avatarUrl,
        area: j.turnoNombre ?? 'Sin turno',
        hora: j.horaInicio,
        estado:
          j.puntual === null ? 'SIN_TURNO' : j.puntual ? 'PUNTUAL' : 'TARDE',
        minutosTarde: j.minutosTarde,
      })),
    });
  }
}
