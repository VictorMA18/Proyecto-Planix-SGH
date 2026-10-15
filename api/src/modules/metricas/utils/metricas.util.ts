import type { RolMiembro, TipoMovimientoAsistencia } from '@prisma/client';
import { porcentaje } from '../../../common/utils/jornada.util';
import { normalizarTexto } from '../../../common/utils/texto.util';
import {
  diaSemana,
  diasDeTurnoEntre,
  diasEntre,
  fechasEntre,
  lunesDe,
  sumarDias,
  ultimoDiaDelMes,
} from '../../../common/utils/zona-horaria.util';
import {
  NIVEL_PUNTUALIDAD,
  type NivelPuntualidad,
  type TipoPeriodo,
} from '../../../common/constants/metricas.constants';

/** Rango de fechas locales (`YYYY-MM-DD`, ambas incluidas). */
export interface Rango {
  desde: string;
  hasta: string;
}

/** Una jornada reducida a lo que usan las métricas. */
export interface JornadaCalculo {
  fecha: string;
  minutos: number;
  puntual: boolean | null;
  minutosTarde: number | null;
  /** Duración del turno de ese día (copia guardada al entrar); `null` si no tenía turno. */
  turnoMin: number | null;
  entrada: Date;
  salida: Date | null;
  /** Lecturas del QR del día, en orden. */
  escaneos: Escaneo[];
}

export interface Escaneo {
  tipo: TipoMovimientoAsistencia;
  hora: Date;
}

/** Un miembro con lo necesario para calcular sus métricas. */
export interface MiembroCalculo {
  miembroId: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  rol: RolMiembro;
  turno: string | null;
  /** Días (1 = lunes … 7 = domingo) y duración de su plantilla actual. */
  plantilla: { dias: number[]; duracionMin: number } | null;
  jornadas: JornadaCalculo[];
}

export interface ResumenColaborador {
  miembroId: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  rol: RolMiembro;
  turno: string | null;
  diasTrabajados: number;
  asistenciaPct: number | null;
  puntualidadPct: number | null;
  horas: number;
  horasExtra: number;
  metaAlcanzada: boolean;
}

export interface Barra {
  etiqueta: string;
  desde: string;
  hasta: string;
  horas: number;
}

export interface Agregado {
  horas: {
    trabajadas: number;
    planificadas: number;
    restantes: number;
    cumplimientoPct: number | null;
  };
  puntualidad: {
    porcentaje: number | null;
    aTiempo: number;
    evaluadas: number;
    nivel: NivelPuntualidad | null;
  };
  horasExtra: { total: number; hoy: number };
  tendencia: {
    promedioDiarioHoras: number;
    variacionPct: number | null;
    metaDiariaHoras: number;
    barras: Barra[];
    mejor: {
      etiqueta: string;
      horas: number;
      variacionPct: number | null;
    } | null;
  };
}

export interface RegistroDia {
  fecha: string;
  conTurno: boolean;
  entrada: Date | null;
  salida: Date | null;
  horas: number;
  puntual: boolean | null;
  minutosTarde: number | null;
  horasExtra: number;
  marcas: number;
  escaneos: Escaneo[];
}

const DIAS_CORTOS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS_LARGOS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const unDecimal = (valor: number) => Math.round(valor * 10) / 10;
const horasDe = (minutos: number) => unDecimal(minutos / 60);
const enRango = (fecha: string, { desde, hasta }: Rango) =>
  fecha >= desde && fecha <= hasta;
const menor = (a: string, b: string) => (a < b ? a : b);

/** Semana (lunes a domingo) o mes completo que contiene `fecha`. */
export function rangoDelPeriodo(tipo: TipoPeriodo, fecha: string): Rango {
  if (tipo === 'SEMANA') {
    const desde = lunesDe(fecha);
    return { desde, hasta: sumarDias(desde, 6) };
  }
  return { desde: `${fecha.slice(0, 7)}-01`, hasta: ultimoDiaDelMes(fecha) };
}

/** Periodo inmediatamente anterior (la semana o el mes previo). */
export function periodoAnterior(tipo: TipoPeriodo, rango: Rango): Rango {
  return rangoDelPeriodo(tipo, sumarDias(rango.desde, -1));
}

/**
 * Tramo del periodo anterior comparable con el actual: si el actual aún está en curso (contiene
 * `hoy`), el anterior se corta en el mismo punto (mismo día de la semana o del mes).
 */
export function tramoComparable(
  actual: Rango,
  anterior: Rango,
  hoy: string,
): Rango {
  if (!enRango(hoy, actual)) return anterior;
  const transcurridos = diasEntre(actual.desde, hoy);
  return {
    desde: anterior.desde,
    hasta: menor(sumarDias(anterior.desde, transcurridos), anterior.hasta),
  };
}

/** Barras del periodo: un día (L–D) por barra en la semana, una semana por barra en el mes. */
export function tramosDeBarras(tipo: TipoPeriodo, rango: Rango): Barra[] {
  if (tipo === 'SEMANA') {
    return fechasEntre(rango.desde, rango.hasta).map((fecha, i) => ({
      etiqueta: DIAS_CORTOS[i],
      desde: fecha,
      hasta: fecha,
      horas: 0,
    }));
  }
  const barras: Barra[] = [];
  let desde = rango.desde;
  while (desde <= rango.hasta) {
    const hasta = menor(sumarDias(lunesDe(desde), 6), rango.hasta);
    barras.push({ etiqueta: `S${barras.length + 1}`, desde, hasta, horas: 0 });
    desde = sumarDias(hasta, 1);
  }
  return barras;
}

/** Nombre largo de una barra para la leyenda («Viernes», «Semana 2»). */
export function nombreDeBarra(tipo: TipoPeriodo, barra: Barra): string {
  return tipo === 'SEMANA'
    ? DIAS_LARGOS[diaSemana(barra.desde) - 1]
    : `Semana ${barra.etiqueta.slice(1)}`;
}

/** Horas por encima del turno de ese día; sin turno no hay horas extra. */
export function minutosExtra(jornada: JornadaCalculo): number {
  return jornada.turnoMin === null
    ? 0
    : Math.max(0, jornada.minutos - jornada.turnoMin);
}

export function nivelDePuntualidad(
  valor: number | null,
): NivelPuntualidad | null {
  if (valor === null) return null;
  if (valor >= NIVEL_PUNTUALIDAD.EXCELENTE) return 'EXCELENTE';
  if (valor >= NIVEL_PUNTUALIDAD.BUENO) return 'BUENO';
  return 'MEJORABLE';
}

/** Variación porcentual; `null` si la base es 0. */
export function variacion(actual: number, anterior: number): number | null {
  return anterior > 0
    ? unDecimal(((actual - anterior) / anterior) * 100)
    : null;
}

const delRango = (jornadas: JornadaCalculo[], rango: Rango) =>
  jornadas.filter((j) => enRango(j.fecha, rango));

/** Minutos planificados: duración del turno por cada día de turno del rango. */
function minutosPlanificados(miembro: MiembroCalculo, rango: Rango): number {
  return miembro.plantilla
    ? diasDeTurnoEntre(rango.desde, rango.hasta, miembro.plantilla.dias) *
        miembro.plantilla.duracionMin
    : 0;
}

/** Resumen de un colaborador en el periodo (asistencia y meta hasta `hoy`). */
export function resumenColaborador(
  miembro: MiembroCalculo,
  rango: Rango,
  hoy: string,
): ResumenColaborador {
  const hastaHoy: Rango = {
    desde: rango.desde,
    hasta: menor(rango.hasta, hoy),
  };
  const propias = delRango(miembro.jornadas, rango);
  const evaluadas = propias.filter((j) => j.puntual !== null);
  const minutos = propias.reduce((s, j) => s + j.minutos, 0);
  const programados = miembro.plantilla
    ? diasDeTurnoEntre(hastaHoy.desde, hastaHoy.hasta, miembro.plantilla.dias)
    : 0;
  const asistidos = miembro.plantilla
    ? propias.filter((j) =>
        miembro.plantilla!.dias.includes(diaSemana(j.fecha)),
      ).length
    : 0;
  const metaHastaHoy = minutosPlanificados(miembro, hastaHoy);

  return {
    miembroId: miembro.miembroId,
    nombre: miembro.nombre,
    email: miembro.email,
    avatarUrl: miembro.avatarUrl,
    rol: miembro.rol,
    turno: miembro.turno,
    diasTrabajados: propias.length,
    asistenciaPct:
      programados > 0
        ? porcentaje(Math.min(asistidos, programados), programados)
        : null,
    puntualidadPct: porcentaje(
      evaluadas.filter((j) => j.puntual).length,
      evaluadas.length,
    ),
    horas: horasDe(minutos),
    horasExtra: horasDe(propias.reduce((s, j) => s + minutosExtra(j), 0)),
    metaAlcanzada: metaHastaHoy > 0 && minutos >= metaHastaHoy,
  };
}

/** Orden de la lista de colaboradores: más horas primero y luego por nombre. */
export function ordenarColaboradores(
  filas: ResumenColaborador[],
): ResumenColaborador[] {
  return [...filas].sort(
    (a, b) => b.horas - a.horas || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

/** Filtra por nombre o correo, sin distinguir mayúsculas ni acentos. */
export function buscarColaboradores(
  filas: ResumenColaborador[],
  q: string | undefined,
): ResumenColaborador[] {
  const termino = q ? normalizarTexto(q) : '';
  return termino
    ? filas.filter(
        (f) =>
          normalizarTexto(f.nombre).includes(termino) ||
          normalizarTexto(f.email).includes(termino),
      )
    : filas;
}

/**
 * Agregado del periodo para uno o varios miembros: horas frente a lo planificado, puntualidad,
 * horas extra y la tendencia (barras, promedio diario y variación frente al periodo anterior).
 */
export function agregarPeriodo(
  miembros: MiembroCalculo[],
  tipo: TipoPeriodo,
  rango: Rango,
  hoy: string,
): Agregado {
  const anterior = periodoAnterior(tipo, rango);
  const comparable = tramoComparable(rango, anterior, hoy);
  const todas = miembros.flatMap((m) => m.jornadas);
  const actuales = delRango(todas, rango);
  const evaluadas = actuales.filter((j) => j.puntual !== null);
  const aTiempo = evaluadas.filter((j) => j.puntual).length;

  const minutos = actuales.reduce((s, j) => s + j.minutos, 0);
  const planificados = miembros.reduce(
    (s, m) => s + minutosPlanificados(m, rango),
    0,
  );
  const minutosEn = (r: Rango) =>
    delRango(todas, r).reduce((s, j) => s + j.minutos, 0);

  const barras = tramosDeBarras(tipo, rango).map((b) => ({
    ...b,
    horas: horasDe(minutosEn(b)),
  }));
  const barrasAnteriores = tramosDeBarras(tipo, anterior).map((b) =>
    horasDe(minutosEn(b)),
  );
  const indiceMejor = barras.reduce(
    (mejor, b, i) => (b.horas > (barras[mejor]?.horas ?? 0) ? i : mejor),
    -1,
  );

  const conTurno = miembros.filter((m) => m.plantilla);
  const diasActivos = new Set(
    actuales.filter((j) => j.minutos > 0).map((j) => j.fecha),
  ).size;
  const puntualidad = porcentaje(aTiempo, evaluadas.length);

  return {
    horas: {
      trabajadas: horasDe(minutos),
      planificadas: horasDe(planificados),
      restantes: horasDe(Math.max(0, planificados - minutos)),
      cumplimientoPct: porcentaje(minutos, planificados),
    },
    puntualidad: {
      porcentaje: puntualidad,
      aTiempo,
      evaluadas: evaluadas.length,
      nivel: nivelDePuntualidad(puntualidad),
    },
    horasExtra: {
      total: horasDe(actuales.reduce((s, j) => s + minutosExtra(j), 0)),
      hoy: horasDe(
        actuales
          .filter((j) => j.fecha === hoy)
          .reduce((s, j) => s + minutosExtra(j), 0),
      ),
    },
    tendencia: {
      promedioDiarioHoras: diasActivos > 0 ? horasDe(minutos / diasActivos) : 0,
      variacionPct: variacion(minutos, minutosEn(comparable)),
      metaDiariaHoras:
        conTurno.length > 0
          ? horasDe(
              conTurno.reduce((s, m) => s + m.plantilla!.duracionMin, 0) /
                conTurno.length,
            )
          : 0,
      barras,
      mejor:
        indiceMejor < 0
          ? null
          : {
              etiqueta: nombreDeBarra(tipo, barras[indiceMejor]),
              horas: barras[indiceMejor].horas,
              variacionPct: variacion(
                barras[indiceMejor].horas,
                barrasAnteriores[indiceMejor] ?? 0,
              ),
            },
    },
  };
}

/** Registro diario de un miembro, del día más reciente al más antiguo y hasta `hoy`. */
export function registroDiario(
  miembro: MiembroCalculo,
  rango: Rango,
  hoy: string,
): RegistroDia[] {
  if (rango.desde > hoy) return [];
  return fechasEntre(rango.desde, menor(rango.hasta, hoy))
    .reverse()
    .map((fecha) => {
      const jornada = miembro.jornadas.find((j) => j.fecha === fecha);
      const conTurno =
        jornada?.turnoMin != null ||
        !!miembro.plantilla?.dias.includes(diaSemana(fecha));
      return {
        fecha,
        conTurno,
        entrada: jornada?.entrada ?? null,
        salida: jornada?.salida ?? null,
        horas: jornada ? horasDe(jornada.minutos) : 0,
        puntual: jornada?.puntual ?? null,
        minutosTarde: jornada?.minutosTarde ?? null,
        horasExtra: jornada ? horasDe(minutosExtra(jornada)) : 0,
        marcas: jornada?.escaneos.length ?? 0,
        escaneos: jornada?.escaneos ?? [],
      };
    });
}
