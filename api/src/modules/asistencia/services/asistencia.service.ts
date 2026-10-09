import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Usuario } from '@prisma/client';
import { evaluarPuntualidad } from '../../../common/utils/jornada.util';
import { esUnicoDuplicado } from '../../../common/utils/prisma-error.util';
import {
  comoFechaDb,
  desdeFechaDb,
  diasEntre,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { QrService } from '../../qr/services/qr.service';
import { AsistenciaHoyResponseDto } from '../dto/asistencia-hoy-response.dto';
import { HistorialQueryDto } from '../dto/historial-query.dto';
import {
  JornadaResponseDto,
  PaginaJornadasResponseDto,
} from '../dto/jornada-response.dto';
import { JornadasService } from './jornadas.service';

const YA_DENTRO =
  'Ya tienes una entrada abierta. Registra tu salida antes de volver a entrar.';
const SIN_ENTRADA = 'No tienes una entrada abierta para registrar la salida.';

const conMovimientos = {
  include: { movimientos: { orderBy: { hora: 'asc' } } },
} satisfies Prisma.JornadaAsistenciaDefaultArgs;

/**
 * Ciclo de asistencia (documentacion/06): la primera entrada del día crea la jornada; luego se
 * alternan SALIDA (sin QR) y ENTRADA de retorno (con un QR vigente). La alternancia se valida
 * con `estado_actual`.
 */
@Injectable()
export class AsistenciaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrService,
    private readonly jornadas: JornadasService,
  ) {}

  async registrarEntrada(
    usuario: Usuario,
    token: string,
  ): Promise<JornadaResponseDto> {
    const codigo = await this.qr.validar(token);
    const ctx = await this.jornadas.contexto(usuario.id, codigo.organizacionId);
    const { ahora, fecha, organizacion } = ctx;
    const actual = await this.jornadas.jornadaActual(
      usuario.id,
      organizacion.id,
      ctx.fecha,
    );

    if (actual?.estadoActual === 'DENTRO')
      throw new BadRequestException(YA_DENTRO);

    if (actual && desdeFechaDb(actual.fecha) === fecha) {
      // Retorno: nueva ENTRADA sobre la misma jornada. `updateMany` con el estado esperado evita
      // que dos escaneos simultáneos abran dos ciclos.
      const jornada = await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.jornadaAsistencia.updateMany({
          where: { id: actual.id, estadoActual: 'FUERA' },
          data: { estadoActual: 'DENTRO' },
        });
        if (count === 0) throw new BadRequestException(YA_DENTRO);
        await tx.movimientoAsistencia.create({
          data: { jornadaId: actual.id, tipo: 'ENTRADA', hora: ahora },
        });
        return tx.jornadaAsistencia.findUniqueOrThrow({
          where: { id: actual.id },
          ...conMovimientos,
        });
      });
      return JornadaResponseDto.desde(jornada, ahora);
    }

    // Primera entrada del día: se copia el turno y se evalúa la puntualidad.
    const turno = this.jornadas.turnoDeHoy(ctx);
    const puntualidad = turno
      ? evaluarPuntualidad(
          ahora,
          turno.inicio,
          organizacion.toleranciaEntradaMin,
        )
      : null;
    try {
      const jornada = await this.prisma.jornadaAsistencia.create({
        data: {
          usuarioId: usuario.id,
          organizacionId: organizacion.id,
          codigoQrId: codigo.id,
          fecha: comoFechaDb(fecha),
          horaInicio: ahora,
          estadoActual: 'DENTRO',
          turnoNombre: turno?.nombre ?? null,
          turnoInicio: turno?.inicio ?? null,
          turnoFin: turno?.fin ?? null,
          minutosTarde: puntualidad?.minutosTarde ?? null,
          puntual: puntualidad?.puntual ?? null,
          movimientos: { create: { tipo: 'ENTRADA', hora: ahora } },
        },
        ...conMovimientos,
      });
      return JornadaResponseDto.desde(jornada, ahora);
    } catch (err) {
      if (esUnicoDuplicado(err)) throw new BadRequestException(YA_DENTRO);
      throw err;
    }
  }

  /** Salida (intermedia o final) sobre la jornada abierta; la hora es la del servidor. */
  async registrarSalida(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<JornadaResponseDto> {
    const ctx = await this.jornadas.contexto(usuario.id, organizacionId);
    const actual = await this.jornadas.jornadaActual(
      usuario.id,
      organizacionId,
      ctx.fecha,
    );
    if (actual?.estadoActual !== 'DENTRO')
      throw new NotFoundException(SIN_ENTRADA);

    const jornada = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.jornadaAsistencia.updateMany({
        where: { id: actual.id, estadoActual: 'DENTRO' },
        data: { estadoActual: 'FUERA', horaFin: ctx.ahora },
      });
      if (count === 0) throw new NotFoundException(SIN_ENTRADA);
      await tx.movimientoAsistencia.create({
        data: { jornadaId: actual.id, tipo: 'SALIDA', hora: ctx.ahora },
      });
      return tx.jornadaAsistencia.findUniqueOrThrow({
        where: { id: actual.id },
        ...conMovimientos,
      });
    });
    return JornadaResponseDto.desde(jornada, ctx.ahora);
  }

  async hoy(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<AsistenciaHoyResponseDto> {
    const ctx = await this.jornadas.contexto(usuario.id, organizacionId);
    const jornada = await this.jornadas.jornadaActual(
      usuario.id,
      organizacionId,
      ctx.fecha,
    );
    return Object.assign(new AsistenciaHoyResponseDto(), {
      fecha: ctx.fecha,
      toleranciaMin: ctx.organizacion.toleranciaEntradaMin,
      turno: this.jornadas.turnoVigente(ctx, jornada),
      jornada: jornada ? JornadaResponseDto.desde(jornada, ctx.ahora) : null,
      calculadoEn: ctx.ahora,
    });
  }

  async historial(
    usuario: Usuario,
    { organizacionId, desde, hasta, page, pageSize }: HistorialQueryDto,
  ): Promise<PaginaJornadasResponseDto> {
    const ctx = await this.jornadas.contexto(usuario.id, organizacionId);
    if (desde && hasta && diasEntre(desde, hasta) < 0) {
      throw new BadRequestException(
        'La fecha «desde» no puede ser posterior a «hasta».',
      );
    }

    const where: Prisma.JornadaAsistenciaWhereInput = {
      usuarioId: usuario.id,
      organizacionId,
      fecha: {
        ...(desde ? { gte: comoFechaDb(desde) } : {}),
        ...(hasta ? { lte: comoFechaDb(hasta) } : {}),
      },
    };
    const [total, jornadas] = await Promise.all([
      this.prisma.jornadaAsistencia.count({ where }),
      this.prisma.jornadaAsistencia.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        ...conMovimientos,
      }),
    ]);
    return Object.assign(new PaginaJornadasResponseDto(), {
      data: jornadas.map((j) => JornadaResponseDto.desde(j, ctx.ahora)),
      page,
      pageSize,
      total,
    });
  }
}
