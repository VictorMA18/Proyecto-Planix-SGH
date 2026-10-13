import type { MetricasMes } from '../utils/resumen-miembro.util';

export class TurnoResumenResponseDto {
  nombre!: string;
  horaInicio!: string;
  horaFin!: string;
}

/** `GET /organizaciones/{id}/miembros/{miembroId}/resumen`: credencial y métricas del mes. */
export class ResumenMiembroResponseDto {
  periodo!: string;
  turno!: TurnoResumenResponseDto | null;
  entradaHoy!: Date | null;
  puntualidad!: number | null;
  horas!: MetricasMes['horas'];
  tareas!: { completadas: number; total: number };

  static desde(datos: {
    metricas: MetricasMes;
    turno: TurnoResumenResponseDto | null;
    entradaHoy: Date | null;
    tareas: { completadas: number; total: number };
  }): ResumenMiembroResponseDto {
    return Object.assign(new ResumenMiembroResponseDto(), {
      periodo: datos.metricas.periodo,
      turno: datos.turno,
      entradaHoy: datos.entradaHoy,
      puntualidad: datos.metricas.puntualidad,
      horas: datos.metricas.horas,
      tareas: datos.tareas,
    });
  }
}
