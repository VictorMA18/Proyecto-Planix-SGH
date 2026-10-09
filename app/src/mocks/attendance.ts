import type { AttendanceMovement } from '@/schemas/attendance.schema';

// Datos de ejemplo de la pestaña «Asistencia» y de la configuración de turnos. Dependen de la fase de
// Asistencia, que aún no existe: solo los consume `services/attendance.ts` y las pantallas los marcan
// como «Ejemplo». La jornada vive en memoria por usuario para que registrar movimientos se note.

const MINUTE = 60_000;
const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

interface Session {
  inicio: number;
  movimientos: AttendanceMovement[];
}

const sessions = new Map<string, Session>();
let sequence = 0;

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

function sessionFor(userId: string, now: number): Session {
  const current = sessions.get(userId);
  if (current && now - current.inicio < 12 * HOUR) return current;

  const entry = now - (1.5 + (hash(userId) % 30) / 10) * HOUR;
  const session: Session = {
    inicio: entry - 2 * MINUTE,
    movimientos: [{ id: `mov-${++sequence}`, tipo: 'ENTRADA', hora: iso(entry) }],
  };
  sessions.set(userId, session);
  return session;
}

function snapshot(session: Session) {
  const last = session.movimientos[session.movimientos.length - 1];
  return {
    turno: {
      nombre: 'Jornada Ordinaria',
      inicio: iso(session.inicio),
      fin: iso(session.inicio + 9 * HOUR),
      objetivoMin: 8 * 60,
    },
    jornada: last
      ? { estadoActual: last.tipo === 'ENTRADA' ? ('DENTRO' as const) : ('FUERA' as const), movimientos: session.movimientos }
      : null,
  };
}

/** JornadaAsistencia de hoy con el turno del usuario. */
export function mockAttendanceToday(userId: string, now = Date.now()) {
  return snapshot(sessionFor(userId, now));
}

/** Registra el siguiente movimiento: alterna ENTRADA y SALIDA como lo haría el backend. */
export function mockRegisterMovement(
  userId: string,
  tipo: 'ENTRADA' | 'SALIDA',
  token?: string,
  now = Date.now(),
) {
  // El backend validará el token contra el QR vigente de la organización (POST /asistencia/entrada).
  if (tipo === 'ENTRADA' && !token?.trim()) throw new Error('El código QR no es válido o ya expiró.');
  const session = sessionFor(userId, now);
  const last = session.movimientos[session.movimientos.length - 1];
  if (last?.tipo === tipo) {
    throw new Error(
      tipo === 'ENTRADA'
        ? 'Ya tienes una entrada abierta. Registra tu pausa o salida antes de volver a entrar.'
        : 'No tienes una entrada abierta para registrar la salida.',
    );
  }
  session.movimientos = [...session.movimientos, { id: `mov-${++sequence}`, tipo, hora: iso(now) }];
  return snapshot(session);
}

type Member = { id: string; nombre: string; avatarUrl?: string | null };

const TOLERANCE_MIN = 15;
const TEAM_PREVIEW = 8;

/** Datos editables de una plantilla (lo que envía el formulario). */
export interface ShiftInput {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  horas: number;
  dias: number[];
  miembroIds: string[];
}

type ShiftRecord = ShiftInput & { id: string };

const shiftStores = new Map<string, ShiftRecord[]>();
let shiftSequence = 0;

function shiftsFor(organizationId: string, members: Member[]): ShiftRecord[] {
  let list = shiftStores.get(organizationId);
  if (!list) {
    // Primera vez: la mitad del equipo real en la mañana y el resto en la tarde.
    const ids = members.map((member) => member.id);
    const half = Math.ceil(ids.length / 2);
    list = [
      {
        id: 'turno-manana',
        nombre: 'Turno Mañana Regular',
        horaInicio: '07:00',
        horaFin: '15:30',
        horas: 8.5,
        dias: [1, 2, 3, 4, 5],
        miembroIds: ids.slice(0, half),
      },
      {
        id: 'turno-tarde',
        nombre: 'Turno Tarde Extendido',
        horaInicio: '14:00',
        horaFin: '22:00',
        horas: 8,
        dias: [1, 2, 3, 4, 5, 6],
        miembroIds: ids.slice(half),
      },
    ];
    shiftStores.set(organizationId, list);
  }
  return list;
}

/** ConfiguracionTurnos: plantillas, personal cubierto y tolerancia de entrada. */
export function mockShiftsConfig(organizationId: string, members: Member[]) {
  const byId = new Map(members.map((member) => [member.id, member]));
  const records = shiftsFor(organizationId, members);

  // Un miembro que ya no está en el equipo deja de contar como asignado.
  const plantillas = records.map((record) => {
    const assigned = record.miembroIds.filter((id) => byId.has(id));
    return {
      ...record,
      miembroIds: assigned,
      asignados: assigned.length,
      equipo: assigned.slice(0, TEAM_PREVIEW).map((id) => byId.get(id)!),
    };
  });

  return {
    plantillas,
    resumen: {
      activas: plantillas.length,
      cubiertos: new Set(plantillas.flatMap((template) => template.miembroIds)).size,
      toleranciaMin: TOLERANCE_MIN,
    },
  };
}

/** Crea (sin `id`) o actualiza una plantilla, incluido su equipo asignado. */
export function mockSaveShift(organizationId: string, members: Member[], input: ShiftInput, id?: string) {
  const list = shiftsFor(organizationId, members);
  const index = id ? list.findIndex((template) => template.id === id) : -1;
  if (id && index === -1) throw new Error('La plantilla ya no existe.');

  if (index === -1) list.push({ ...input, id: `turno-nuevo-${++shiftSequence}` });
  else list[index] = { ...list[index], ...input };
  return mockShiftsConfig(organizationId, members);
}

/** Elimina una plantilla; sus miembros quedan sin turno. */
export function mockDeleteShift(organizationId: string, members: Member[], id: string) {
  const list = shiftsFor(organizationId, members);
  const index = list.findIndex((template) => template.id === id);
  if (index === -1) throw new Error('La plantilla ya no existe.');
  list.splice(index, 1);
  return mockShiftsConfig(organizationId, members);
}
