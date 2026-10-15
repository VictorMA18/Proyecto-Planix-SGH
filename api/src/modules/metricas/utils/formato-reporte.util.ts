import type { RolMiembro } from '@prisma/client';
import type { MetricasCalculadas } from '../interfaces/metricas.interface';
import type { NivelPuntualidad } from '../../../common/constants/metricas.constants';
import { normalizarTexto } from '../../../common/utils/texto.util';

/** Textos y formatos comunes del reporte (PDF y Excel), en español y en la zona de la organización. */

export const NOMBRE_ROL: Record<RolMiembro, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  EMPLEADO: 'Empleado',
};

export const NOMBRE_NIVEL: Record<NivelPuntualidad, string> = {
  EXCELENTE: 'Excelente',
  BUENO: 'Bueno',
  MEJORABLE: 'Mejorable',
};

const mayuscula = (texto: string) =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

/** `2026-10-21` → «21 oct 2026». La fecha es de calendario: se formatea en UTC. */
export function fechaCorta(fecha: string): string {
  return new Date(`${fecha}T12:00:00Z`)
    .toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace('.', '');
}

/** `2026-10-21` → «Mié 21/10». */
export function diaConFecha(fecha: string): string {
  const dia = new Date(`${fecha}T12:00:00Z`);
  const nombre = dia
    .toLocaleDateString('es', { weekday: 'short', timeZone: 'UTC' })
    .replace('.', '');
  return `${mayuscula(nombre)} ${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

/** Hora local `HH:mm` de un instante, o «—». */
export function horaLocal(instante: Date | null, zona: string): string {
  return instante
    ? instante.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: zona,
      })
    : '—';
}

/** Fecha y hora de emisión: «15 oct 2026, 16:03». */
export function fechaHoraEmision(instante: Date, zona: string): string {
  return instante
    .toLocaleString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: zona,
    })
    .replace('.', '');
}

export const horas = (valor: number) =>
  `${valor.toLocaleString('es', { maximumFractionDigits: 1 })} h`;

export const pct = (valor: number | null) =>
  valor === null
    ? '—'
    : `${valor.toLocaleString('es', { maximumFractionDigits: 1 })} %`;

/** «Semana del 19 al 25 oct 2026» o «Octubre 2026». */
export function tituloPeriodo(m: MetricasCalculadas): string {
  if (m.tipo === 'MES') {
    const mes = new Date(`${m.rango.desde}T12:00:00Z`).toLocaleDateString(
      'es',
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    );
    return mayuscula(mes.replace(' de ', ' '));
  }
  return `Semana del ${Number(m.rango.desde.slice(8))} al ${fechaCorta(m.rango.hasta)}`;
}

/** Alcance para el encabezado: «Todo el equipo (12 colaboradores)» o el nombre del miembro. */
export function tituloAlcance(m: MetricasCalculadas): string {
  if (m.miembro) {
    const turno = m.miembro.turno ? ` · ${m.miembro.turno}` : ' · Sin turno';
    return `${m.miembro.nombre} · ${NOMBRE_ROL[m.miembro.rol]}${turno}`;
  }
  const n = m.miembrosActivos;
  return `Todo el equipo (${n} ${n === 1 ? 'colaborador' : 'colaboradores'})`;
}

/** Nombre del archivo: `planix-reporte-<org o miembro>-<desde>_<hasta>.<ext>`. */
export function nombreArchivo(
  m: MetricasCalculadas,
  extension: 'pdf' | 'xlsx',
): string {
  const sujeto = normalizarTexto(m.miembro?.nombre ?? m.organizacion.nombre)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `planix-reporte-${sujeto || 'equipo'}-${m.rango.desde}_${m.rango.hasta}.${extension}`;
}

/** Estado de un día del registro: «Puntual», «Tarde (12 min)», «Sin registro», «Libre». */
export function estadoDelDia(dia: {
  conTurno: boolean;
  entrada: Date | null;
  puntual: boolean | null;
  minutosTarde: number | null;
}): string {
  if (!dia.entrada) return dia.conTurno ? 'Ausente' : 'Libre';
  if (dia.puntual === null) return 'Sin turno';
  return dia.puntual ? 'Puntual' : `Tarde (${dia.minutosTarde ?? 0} min)`;
}
