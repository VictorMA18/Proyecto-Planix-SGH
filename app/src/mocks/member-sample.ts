// Datos de ejemplo de la credencial digital y las métricas del perfil de un miembro. Dependen de
// asistencia (Fase 2) y tareas (Fase 3), que aún no existen: solo los consume `services/team.ts` y
// la pantalla los marca como «Ejemplo». Son deterministas por miembro para que no cambien en cada visita.

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

export function mockMemberSample(memberId: string) {
  const h = hash(memberId);
  const turnosTotal = 20 + (h % 5);
  const tareasTotal = 12 + (h % 9);
  const periodo = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' });

  return {
    periodo: periodo.charAt(0).toUpperCase() + periodo.slice(1),
    turno: `Turno Día ${'ABC'[h % 3]}`,
    jornada: { inicio: '07:00 AM', fin: '04:30 PM' },
    registroEntrada: `06:${String(40 + (h % 19)).padStart(2, '0')} AM`,
    puntualidad: 90 + ((h % 99) / 10),
    turnos: { completados: turnosTotal - (h % 2), total: turnosTotal },
    tareas: { completadas: tareasTotal - (h % 4), total: tareasTotal },
  };
}
