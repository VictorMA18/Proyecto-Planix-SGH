import { porcentaje } from '../../../common/utils/jornada.util';
import {
  diasDeTurnoEntre,
  diasEntre,
  lunesDe,
  sumarDias,
  ultimoDiaDelMes,
} from '../../../common/utils/zona-horaria.util';

/** Una jornada ya reducida a lo que usan las métricas. */
export interface JornadaResumen {
  /** `YYYY-MM-DD` local. */
  fecha: string;
  puntual: boolean | null;
  minutosTrabajados: number;
}

export interface MetricasMes {
  periodo: string;
  puntualidad: number | null;
  horas: { trabajadas: number; meta: number; variacionSemana: number };
}

const unDecimal = (valor: number) => Math.round(valor * 10) / 10;

/** Días del mes de `fecha` que caen en los días aplicables del turno. */
export function diasDeTurnoEnElMes(fecha: string, dias: number[]): number {
  return diasDeTurnoEntre(
    `${fecha.slice(0, 7)}-01`,
    ultimoDiaDelMes(fecha),
    dias,
  );
}

/** Primer día que hay que leer para las métricas: el inicio del mes o el lunes anterior. */
export function desdeParaMetricas(hoy: string): string {
  const inicioMes = `${hoy.slice(0, 7)}-01`;
  const lunesPasado = sumarDias(lunesDe(hoy), -7);
  return lunesPasado < inicioMes ? lunesPasado : inicioMes;
}

/**
 * Métricas del mes de `hoy`: puntualidad (de las jornadas con turno evaluado), horas trabajadas
 * frente a la meta (duración del turno por cada día aplicable del mes) y la variación de horas de
 * esta semana frente a la anterior hasta el mismo día de la semana.
 */
export function metricasDelMes(
  hoy: string,
  jornadas: JornadaResumen[],
  turno: { dias: number[]; objetivoMin: number } | null,
): MetricasMes {
  const periodo = hoy.slice(0, 7);
  const delMes = jornadas.filter((j) => j.fecha.startsWith(periodo));
  const evaluadas = delMes.filter((j) => j.puntual !== null);

  const lunes = lunesDe(hoy);
  const transcurridos = diasEntre(lunes, hoy);
  const lunesPasado = sumarDias(lunes, -7);
  const minutosEntre = (desde: string, hasta: string) =>
    jornadas
      .filter((j) => j.fecha >= desde && j.fecha <= hasta)
      .reduce((suma, j) => suma + j.minutosTrabajados, 0);

  return {
    periodo,
    puntualidad: porcentaje(
      evaluadas.filter((j) => j.puntual).length,
      evaluadas.length,
    ),
    horas: {
      trabajadas: unDecimal(
        delMes.reduce((suma, j) => suma + j.minutosTrabajados, 0) / 60,
      ),
      meta: turno
        ? unDecimal(
            (diasDeTurnoEnElMes(hoy, turno.dias) * turno.objetivoMin) / 60,
          )
        : 0,
      variacionSemana: unDecimal(
        (minutosEntre(lunes, hoy) -
          minutosEntre(lunesPasado, sumarDias(lunesPasado, transcurridos))) /
          60,
      ),
    },
  };
}
