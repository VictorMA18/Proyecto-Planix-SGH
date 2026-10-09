import type {
  EstadoJornada,
  JornadaAsistencia,
  MovimientoAsistencia,
  TipoMovimientoAsistencia,
} from '@prisma/client';
import { minutosTrabajados } from '../../../common/utils/jornada.util';
import { desdeFechaDb } from '../../../common/utils/zona-horaria.util';

export class MovimientoResponseDto {
  id!: string;
  tipo!: TipoMovimientoAsistencia;
  hora!: Date;

  static desde(m: MovimientoAsistencia): MovimientoResponseDto {
    return Object.assign(new MovimientoResponseDto(), {
      id: m.id,
      tipo: m.tipo,
      hora: m.hora,
    });
  }
}

export class TurnoJornadaResponseDto {
  nombre!: string;
  inicio!: Date;
  fin!: Date;
}

export type JornadaConMovimientos = JornadaAsistencia & {
  movimientos: MovimientoAsistencia[];
};

/** Jornada de un día con sus movimientos y el turno y la puntualidad registrados al entrar. */
export class JornadaResponseDto {
  id!: string;
  usuarioId!: string;
  organizacionId!: string;
  codigoQrId!: string;
  fecha!: string;
  horaInicio!: Date;
  horaFin!: Date | null;
  estadoActual!: EstadoJornada;
  turno!: TurnoJornadaResponseDto | null;
  minutosTarde!: number | null;
  puntual!: boolean | null;
  /** Minutos trabajados; un tramo abierto cuenta hasta `ahora`. */
  minutosTrabajados!: number;
  movimientos!: MovimientoResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;

  static desde(
    jornada: JornadaConMovimientos,
    ahora: Date,
  ): JornadaResponseDto {
    const movimientos = [...jornada.movimientos].sort(
      (a, b) => a.hora.getTime() - b.hora.getTime(),
    );
    return Object.assign(new JornadaResponseDto(), {
      id: jornada.id,
      usuarioId: jornada.usuarioId,
      organizacionId: jornada.organizacionId,
      codigoQrId: jornada.codigoQrId,
      fecha: desdeFechaDb(jornada.fecha),
      horaInicio: jornada.horaInicio,
      horaFin: jornada.horaFin,
      estadoActual: jornada.estadoActual,
      turno:
        jornada.turnoNombre && jornada.turnoInicio && jornada.turnoFin
          ? {
              nombre: jornada.turnoNombre,
              inicio: jornada.turnoInicio,
              fin: jornada.turnoFin,
            }
          : null,
      minutosTarde: jornada.minutosTarde,
      puntual: jornada.puntual,
      minutosTrabajados: minutosTrabajados(movimientos, ahora),
      movimientos: movimientos.map((m) => MovimientoResponseDto.desde(m)),
      createdAt: jornada.createdAt,
      updatedAt: jornada.updatedAt,
    });
  }
}

export class PaginaJornadasResponseDto {
  data!: JornadaResponseDto[];
  page!: number;
  pageSize!: number;
  total!: number;
}
