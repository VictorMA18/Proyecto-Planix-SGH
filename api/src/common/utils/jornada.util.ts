import type { TipoMovimientoAsistencia } from '@prisma/client';
import { duracionTurnoMin, minutosDeTimeDb } from './hora.util';
import { diaSemana, instanteLocal } from './zona-horaria.util';

const MINUTO_MS = 60_000;

export interface MovimientoBasico {
  tipo: TipoMovimientoAsistencia;
  hora: Date;
}

/**
 * Milisegundos trabajados: suma de los tramos ENTRADA → SALIDA en orden cronológico. Un tramo
 * abierto (ENTRADA sin SALIDA) cuenta hasta `hasta`. Un movimiento fuera de secuencia se ignora.
 */
export function msTrabajados(
  movimientos: MovimientoBasico[],
  hasta: Date,
): number {
  const ordenados = [...movimientos].sort(
    (a, b) => a.hora.getTime() - b.hora.getTime(),
  );
  let total = 0;
  let abierto: number | null = null;
  for (const mov of ordenados) {
    const t = mov.hora.getTime();
    if (mov.tipo === 'ENTRADA') {
      if (abierto === null) abierto = t;
    } else if (abierto !== null) {
      total += Math.max(0, t - abierto);
      abierto = null;
    }
  }
  if (abierto !== null) total += Math.max(0, hasta.getTime() - abierto);
  return total;
}

/** Minutos enteros trabajados. */
export function minutosTrabajados(
  movimientos: MovimientoBasico[],
  hasta: Date,
): number {
  return Math.floor(msTrabajados(movimientos, hasta) / MINUTO_MS);
}

export interface PlantillaBasica {
  nombre: string;
  /** Minutos desde la medianoche. */
  inicioMin: number;
  finMin: number;
  dias: number[];
}

/** Plantilla tal como sale de Prisma (columnas `TIME`) → forma de cálculo. */
export function plantillaBasica(plantilla: {
  nombre: string;
  horaInicio: Date;
  horaFin: Date;
  dias: number[];
}): PlantillaBasica {
  return {
    nombre: plantilla.nombre,
    inicioMin: minutosDeTimeDb(plantilla.horaInicio),
    finMin: minutosDeTimeDb(plantilla.horaFin),
    dias: plantilla.dias,
  };
}

export interface TurnoDelDia {
  nombre: string;
  inicio: Date;
  fin: Date;
  objetivoMin: number;
}

/** Turno que aplica en `fecha` (zona de la organización), o `null` si ese día no le toca. */
export function turnoDelDia(
  plantilla: PlantillaBasica,
  fecha: string,
  zona: string,
): TurnoDelDia | null {
  if (!plantilla.dias.includes(diaSemana(fecha))) return null;
  const objetivoMin = duracionTurnoMin(plantilla.inicioMin, plantilla.finMin);
  const inicio = instanteLocal(fecha, plantilla.inicioMin, zona);
  return {
    nombre: plantilla.nombre,
    inicio,
    fin: new Date(inicio.getTime() + objetivoMin * MINUTO_MS),
    objetivoMin,
  };
}

export interface Puntualidad {
  minutosTarde: number;
  puntual: boolean;
}

/** Minutos de retraso de la entrada frente al inicio del turno y si entra dentro de la tolerancia. */
export function evaluarPuntualidad(
  entrada: Date,
  inicioTurno: Date,
  toleranciaMin: number,
): Puntualidad {
  const minutosTarde = Math.max(
    0,
    Math.floor((entrada.getTime() - inicioTurno.getTime()) / MINUTO_MS),
  );
  return { minutosTarde, puntual: minutosTarde <= toleranciaMin };
}

/** Porcentaje redondeado a un decimal; `null` si no hay base. */
export function porcentaje(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 1000) / 10 : null;
}
