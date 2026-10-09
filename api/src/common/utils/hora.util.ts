// Columnas `TIME`: Prisma las representa como `Date` del 1970-01-01 en UTC.

/** `07:30` → minutos desde la medianoche (450). */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos → `HH:mm`. */
export function horaDeMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

/** `07:30` → valor para una columna `TIME`. */
export function aTimeDb(hora: string): Date {
  return new Date(`1970-01-01T${hora}:00.000Z`);
}

/** Columna `TIME` → minutos desde la medianoche. */
export function minutosDeTimeDb(valor: Date): number {
  return valor.getUTCHours() * 60 + valor.getUTCMinutes();
}

/** Columna `TIME` → `HH:mm`. */
export function horaDeTimeDb(valor: Date): string {
  return horaDeMinutos(minutosDeTimeDb(valor));
}

/** Duración de un turno en minutos; si el fin no es posterior al inicio, cruza la medianoche. */
export function duracionTurnoMin(inicioMin: number, finMin: number): number {
  const duracion = finMin - inicioMin;
  return duracion > 0 ? duracion : duracion + 24 * 60;
}
