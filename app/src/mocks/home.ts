// Datos de ejemplo de la pestaña «Inicio». Dependen de asistencia (Fase 2), tareas (Fase 3) y el QR
// diario, que aún no existen: solo los consume `services/home.ts` y la pantalla los marca como
// «Ejemplo». Se anclan al reloj real para que el cronómetro y la cuenta atrás sean coherentes.

const MINUTE = 60_000;
const HOUR = 3_600_000;
const SHIFT_MS = 8 * HOUR;

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

const iso = (ms: number) => new Date(ms).toISOString();

// Hora de entrada simulada por usuario: se mantiene mientras dura el turno para que el
// cronómetro no salte cada vez que se recargan los datos.
const entryAnchors = new Map<string, number>();

/** InicioEmpleado: jornada de hoy, métricas de la semana y tareas de hoy. */
export function mockEmployeeHome(userId: string, now = Date.now()) {
  const h = hash(userId);

  let entry = entryAnchors.get(userId);
  if (!entry || now - entry >= SHIFT_MS) {
    entry = now - (1.5 + (h % 40) / 10) * HOUR; // entró hace entre 1,5 y 5,4 h
    entryAnchors.set(userId, entry);
  }

  const minutosTarde = h % 4 === 0 ? 8 + (h % 10) : 0;
  const inicio = entry - (minutosTarde || 2) * MINUTE;
  const startHour = new Date(inicio).getHours();
  const dueA = Math.ceil((now + 2 * HOUR) / (30 * MINUTE)) * 30 * MINUTE;
  const tareasTotal = 12 + (h % 9);

  return {
    turno: {
      nombre: startHour < 12 ? 'Mañana' : startHour < 19 ? 'Tarde' : 'Noche',
      inicio: iso(inicio),
      fin: iso(inicio + SHIFT_MS),
    },
    estado: 'DENTRO' as const,
    entrada: { registradaEn: iso(entry), puntual: minutosTarde === 0, minutosTarde },
    semana: {
      horas: { total: 28 + (h % 120) / 10, variacionPct: ((h % 90) - 20) / 10 },
      puntualidad: 90 + (h % 90) / 10,
      tareas: { completadas: tareasTotal - (h % 5), total: tareasTotal },
    },
    tareasHoy: [
      {
        id: 't-1',
        titulo: 'Auditoría de inventario piso 2',
        descripcion: 'Verificar existencias de suministros médicos del almacén y registrar diferencias.',
        prioridad: 'ALTA' as const,
        estado: 'PENDIENTE' as const,
        estimadoMin: 45,
        venceEn: iso(dueA),
      },
      {
        id: 't-2',
        titulo: 'Revisión checklist seguridad mensual',
        descripcion: 'Inspeccionar extintores y salidas de evacuación según el protocolo.',
        prioridad: 'MEDIA' as const,
        estado: 'PENDIENTE' as const,
        estimadoMin: 30,
        venceEn: iso(dueA + 2 * HOUR),
      },
      {
        id: 't-3',
        titulo: 'Reunión de alineación operativa',
        descripcion: 'Coordinación del turno con el equipo.',
        prioridad: 'BAJA' as const,
        estado: 'COMPLETADA' as const,
        completadaEn: iso(Math.max(entry + 45 * MINUTE, now - 30 * MINUTE)),
        participantes: 6,
      },
    ],
  };
}

const AREAS = ['Operaciones • Estación 04', 'Supervisión • Despacho', 'Control Calidad • Línea B', 'Almacén • Zona 2'];
const DIAS = ['L', 'M', 'X', 'J', 'V'];

/**
 * PanelAdmin. `esperados` y las personas salen del equipo real; el resto (quién está presente, tareas,
 * puntualidad) es de ejemplo pero coherente con esos números.
 */
export function mockAdminHome(
  organizationId: string,
  esperados: number,
  people: { id: string; nombre: string }[],
  now = Date.now(),
) {
  const h = hash(organizationId);
  const presentes = Math.min(esperados, Math.round(esperados * (0.82 + (h % 12) / 100)));
  const retrasos = Math.round(presentes * 0.12);
  const tareasTotal = Math.max(10, esperados + 2);

  // Lunes = 0. De sábado a domingo se muestra la semana completa.
  const hoy = (new Date(now).getDay() + 6) % 7;
  const dias = DIAS.map((dia, i) => ({
    dia,
    valor: i <= hoy ? 88 + ((h >> i) % 11) : null,
  }));
  const valores = dias.map((d) => d.valor).filter((v): v is number => v !== null);

  return {
    qr: { expiraEn: iso((Math.floor(now / (5 * MINUTE)) + 1) * 5 * MINUTE) },
    presencia: {
      presentes,
      esperados,
      puntuales: presentes - retrasos,
      retrasos,
      pendientes: esperados - presentes,
    },
    tareasOrganizacion: { completadas: Math.round(tareasTotal * 0.76), total: tareasTotal },
    puntualidadSemanal: {
      dias,
      promedio: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0,
    },
    asistenciasRecientes: people.slice(0, 4).map((person, i) => {
      const tarde = i === 1;
      return {
        id: person.id,
        nombre: person.nombre,
        area: AREAS[(h + i) % AREAS.length],
        hora: iso(now - (i * 6 + 3) * MINUTE),
        estado: tarde ? ('TARDE' as const) : ('PUNTUAL' as const),
        minutosTarde: tarde ? 14 : 0,
      };
    }),
  };
}
