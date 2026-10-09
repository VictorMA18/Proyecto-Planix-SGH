// Fechas y horas en la zona horaria de la organización, sin dependencias: `Intl` resuelve el
// desfase (incluido el horario de verano) y estas funciones lo aplican. Las fechas de calendario
// viajan como texto `YYYY-MM-DD`.

const MINUTO_MS = 60_000;
const DIA_MS = 86_400_000;

interface PartesLocales {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateador(zona: string): Intl.DateTimeFormat {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formateadores.set(zona, f);
  }
  return f;
}

function partesLocales(instante: Date, zona: string): PartesLocales {
  const partes = Object.fromEntries(
    formateador(zona)
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour),
    minuto: Number(partes.minute),
  };
}

const dosCifras = (n: number) => String(n).padStart(2, '0');

/** Fecha de calendario (`YYYY-MM-DD`) de un instante en la zona indicada. */
export function fechaLocal(instante: Date, zona: string): string {
  const { anio, mes, dia } = partesLocales(instante, zona);
  return `${anio}-${dosCifras(mes)}-${dosCifras(dia)}`;
}

/** Minutos transcurridos desde la medianoche local de ese instante. */
export function minutosLocales(instante: Date, zona: string): number {
  const { hora, minuto } = partesLocales(instante, zona);
  return hora * 60 + minuto;
}

/** Instante UTC que corresponde a `fecha` + `minutos` desde la medianoche, en la zona indicada. */
export function instanteLocal(
  fecha: string,
  minutos: number,
  zona: string,
): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const objetivo = Date.UTC(anio, mes - 1, dia) + minutos * MINUTO_MS;
  // Primera aproximación con el desfase en `objetivo`; se corrige una vez por si cruza un cambio
  // de horario.
  let instante = objetivo;
  for (let i = 0; i < 2; i++) {
    const p = partesLocales(new Date(instante), zona);
    const visto =
      Date.UTC(p.anio, p.mes - 1, p.dia) + (p.hora * 60 + p.minuto) * MINUTO_MS;
    instante += objetivo - visto;
  }
  return new Date(instante);
}

/** `fecha` desplazada `dias` días (puede ser negativo). */
export function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * DIA_MS)
    .toISOString()
    .slice(0, 10);
}

/** Día de la semana de una fecha: 1 = lunes … 7 = domingo. */
export function diaSemana(fecha: string): number {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return dia === 0 ? 7 : dia;
}

/** Lunes de la semana de `fecha`. */
export function lunesDe(fecha: string): string {
  return sumarDias(fecha, 1 - diaSemana(fecha));
}

/** Días entre dos fechas (`hasta - desde`). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      DIA_MS,
  );
}

/** Valor para columnas `DATE` de Prisma (medianoche UTC de esa fecha). */
export function comoFechaDb(fecha: string): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

/** Lectura inversa de una columna `DATE` de Prisma. */
export function desdeFechaDb(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
