// Datos de ejemplo del centro de notificaciones (Fase 4, sin backend). Solo los consume
// `services/notifications.ts`, con la forma de los contratos proyectados Notificacion y
// PreferenciasNotificacion. Las fechas son relativas al primer uso y los cambios (leer, guardar
// preferencias) viven en memoria hasta recargar la app.

import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/constants/notifications';
import type { AppNotification, NotificationPreferences } from '@/schemas/notification.schema';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Instante de hace `days` días a la hora local `hh:mm`. */
function at(days: number, hours: number, minutes: number): Date {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

type Sample = Omit<AppNotification, 'id' | 'notificacionId' | 'organizacionId' | 'leidaEn' | 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
};

function samples(): Sample[] {
  const now = Date.now();
  const carlos = { id: 'mock-usuario-carlos', nombre: 'Carlos M.' };
  const base = { referenciaId: null, actor: null, asistencia: null };

  return [
    {
      ...base,
      tipo: 'TURNO_ACTUALIZADO',
      titulo: 'Cambio en tu turno de mañana',
      contenido: 'El administrador Carlos M. actualizó tu horario del viernes a 08:00 - 16:30 hrs.',
      referenciaId: 'mock-turno-a',
      actor: carlos,
      leida: false,
      createdAt: new Date(now - 12 * MINUTE),
    },
    {
      ...base,
      tipo: 'TAREA_ASIGNADA',
      titulo: 'Nueva tarea asignada',
      contenido: 'Mayad A. te asignó a «Implementación campaña marketing Q1».',
      referenciaId: 'mock-tarea-campana',
      actor: { id: 'mock-usuario-mayad', nombre: 'Mayad A.' },
      leida: false,
      createdAt: new Date(now - 45 * MINUTE),
    },
    {
      ...base,
      tipo: 'ASISTENCIA_REGISTRADA',
      titulo: 'Registro de asistencia exitoso',
      contenido: 'Entrada verificada por código QR dinámico.',
      asistencia: { puntual: true, turno: 'Turno A (09:00 - 18:00)' },
      leida: false,
      createdAt: new Date(now - 190 * MINUTE),
    },
    {
      ...base,
      tipo: 'MIEMBRO_NUEVO',
      titulo: 'Nuevo miembro en tu organización',
      contenido: 'Sofía Valenzuela se unió a la organización.',
      actor: { id: 'mock-usuario-sofia', nombre: 'Sofía Valenzuela' },
      leida: true,
      createdAt: at(1, 16, 20),
    },
    {
      ...base,
      tipo: 'TURNO_ASIGNADO',
      titulo: 'Nuevo turno asignado',
      contenido: 'Carlos M. te asignó el Turno A de lunes a viernes.',
      referenciaId: 'mock-turno-a',
      actor: carlos,
      leida: true,
      createdAt: at(1, 10, 5),
    },
    {
      ...base,
      tipo: 'TAREA_ACTUALIZADA',
      titulo: 'Subtarea completada',
      contenido: 'Tanvir S. completó «Aprobar copys creativos con el equipo legal».',
      referenciaId: 'mock-tarea-campana',
      actor: { id: 'mock-usuario-tanvir', nombre: 'Tanvir S.' },
      leida: true,
      createdAt: at(3, 14, 10),
    },
    {
      ...base,
      tipo: 'RECORDATORIO_SALIDA',
      titulo: 'Recuerda registrar tu salida',
      contenido: 'Tu turno termina en 15 minutos. Escanea el QR al salir.',
      leida: true,
      createdAt: at(3, 17, 45),
    },
    {
      ...base,
      tipo: 'TURNO_ACTUALIZADO',
      titulo: 'Tolerancia de entrada actualizada',
      contenido: 'Carlos M. cambió la tolerancia de entrada a 10 minutos.',
      referenciaId: 'mock-turno-a',
      actor: carlos,
      leida: true,
      createdAt: at(9, 9, 30),
    },
  ];
}

const inboxes = new Map<string, AppNotification[]>();
let preferences: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };

function inbox(organizationId: string): AppNotification[] {
  let items = inboxes.get(organizationId);
  if (!items) {
    items = samples().map((sample, i) => {
      const createdAt = sample.createdAt.toISOString();
      return {
        ...sample,
        id: `mock-notificacion-${i + 1}`,
        notificacionId: `mock-evento-${i + 1}`,
        organizacionId: organizationId,
        leidaEn: sample.leida ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      };
    });
    inboxes.set(organizationId, items);
  }
  return items;
}

// Backend: GET /notificaciones?organizacionId
export function mockListNotifications(organizationId: string): AppNotification[] {
  return inbox(organizationId).map((item) => ({ ...item }));
}

// Backend: PATCH /notificaciones/{notificacionId}/leer
export function mockMarkNotificationRead(organizationId: string, id: string): AppNotification {
  const item = inbox(organizationId).find((notification) => notification.id === id);
  if (!item) throw new Error('La notificación no existe.');
  if (!item.leida) {
    const now = new Date().toISOString();
    Object.assign(item, { leida: true, leidaEn: now, updatedAt: now });
  }
  return { ...item };
}

// Backend: PATCH /notificaciones/leer-todas?organizacionId
export function mockMarkAllNotificationsRead(organizationId: string): { actualizadas: number } {
  const now = new Date().toISOString();
  const pending = inbox(organizationId).filter((item) => !item.leida);
  for (const item of pending) Object.assign(item, { leida: true, leidaEn: now, updatedAt: now });
  return { actualizadas: pending.length };
}

// Backend: GET /me/preferencias-notificacion
export function mockGetNotificationPreferences(): NotificationPreferences {
  return { ...preferences };
}

// Backend: PUT /me/preferencias-notificacion
export function mockSaveNotificationPreferences(next: NotificationPreferences): NotificationPreferences {
  preferences = { ...next };
  return { ...preferences };
}
