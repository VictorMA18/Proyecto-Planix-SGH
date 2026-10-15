import type { RolMiembro } from '@prisma/client';
import {
  COLABORADORES_DESTACADOS,
  type TipoPeriodo,
} from '../../../common/constants/metricas.constants';
import type {
  Alcance,
  MetricasCalculadas,
  MiembroObjetivo,
} from '../interfaces/metricas.interface';
import type {
  Agregado,
  RegistroDia,
  ResumenColaborador,
} from '../utils/metricas.util';

/** Un colaborador en el resumen del equipo y en «Ver todos». */
export class ResumenColaboradorResponseDto {
  miembroId!: string;
  nombre!: string;
  email!: string;
  avatarUrl!: string | null;
  rol!: RolMiembro;
  turno!: string | null;
  diasTrabajados!: number;
  asistenciaPct!: number | null;
  puntualidadPct!: number | null;
  horas!: number;
  horasExtra!: number;
  metaAlcanzada!: boolean;

  static desde(fila: ResumenColaborador): ResumenColaboradorResponseDto {
    return Object.assign(new ResumenColaboradorResponseDto(), {
      miembroId: fila.miembroId,
      nombre: fila.nombre,
      email: fila.email,
      avatarUrl: fila.avatarUrl,
      rol: fila.rol,
      turno: fila.turno,
      diasTrabajados: fila.diasTrabajados,
      asistenciaPct: fila.asistenciaPct,
      puntualidadPct: fila.puntualidadPct,
      horas: fila.horas,
      horasExtra: fila.horasExtra,
      metaAlcanzada: fila.metaAlcanzada,
    });
  }
}

/** `GET /organizaciones/{id}/metricas/colaboradores`. */
export class PaginaColaboradoresResponseDto {
  items!: ResumenColaboradorResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;

  static desde(
    filas: ResumenColaborador[],
    page: number,
    pageSize: number,
  ): PaginaColaboradoresResponseDto {
    const inicio = (page - 1) * pageSize;
    return Object.assign(new PaginaColaboradoresResponseDto(), {
      items: filas
        .slice(inicio, inicio + pageSize)
        .map((f) => ResumenColaboradorResponseDto.desde(f)),
      total: filas.length,
      page,
      pageSize,
    });
  }
}

/** `GET /organizaciones/{id}/metricas`. */
export class MetricasPeriodoResponseDto {
  periodo!: { tipo: TipoPeriodo; desde: string; hasta: string };
  alcance!: Alcance;
  miembro!: MiembroObjetivo | null;
  miembrosActivos!: number;
  tendencia!: Agregado['tendencia'];
  horas!: Agregado['horas'];
  puntualidad!: Agregado['puntualidad'];
  horasExtra!: Agregado['horasExtra'];
  colaboradores!: {
    total: number;
    top: ResumenColaboradorResponseDto[];
  } | null;
  registroDiario!: RegistroDia[] | null;
  tareas!: { completadas: number; total: number } | null;

  static desde(m: MetricasCalculadas): MetricasPeriodoResponseDto {
    return Object.assign(new MetricasPeriodoResponseDto(), {
      periodo: { tipo: m.tipo, ...m.rango },
      alcance: m.alcance,
      miembro: m.miembro,
      miembrosActivos: m.miembrosActivos,
      tendencia: m.agregado.tendencia,
      horas: m.agregado.horas,
      puntualidad: m.agregado.puntualidad,
      horasExtra: m.agregado.horasExtra,
      colaboradores: m.colaboradores
        ? {
            total: m.colaboradores.length,
            top: m.colaboradores
              .slice(0, COLABORADORES_DESTACADOS)
              .map((f) => ResumenColaboradorResponseDto.desde(f)),
          }
        : null,
      registroDiario: m.registroDiario,
      tareas: m.tareas,
    });
  }
}
