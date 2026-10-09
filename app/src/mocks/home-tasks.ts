// Tareas de ejemplo de la pestaña «Inicio». Las tareas llegan con la Fase 3: solo las consume
// `services/home.ts` (hook `useHomeTasks`) y la pantalla las marca como «Ejemplo».

const MINUTE = 60_000;
const HOUR = 3_600_000;

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

const iso = (ms: number) => new Date(ms).toISOString();

/** Tareas de hoy y avance semanal propio y de la organización (forma de TareaInicio, proyectado). */
export function mockHomeTasks(userId: string, organizationId: string, now = Date.now()) {
  const h = hash(`${userId}:${organizationId}`);
  const dueA = Math.ceil((now + 2 * HOUR) / (30 * MINUTE)) * 30 * MINUTE;
  const weekTotal = 12 + (h % 9);
  const orgTotal = 30 + (h % 25);

  return {
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
        completadaEn: iso(now - 30 * MINUTE),
        participantes: 6,
      },
    ],
    semana: { completadas: weekTotal - (h % 5), total: weekTotal },
    organizacion: { completadas: Math.round(orgTotal * 0.76), total: orgTotal },
  };
}
