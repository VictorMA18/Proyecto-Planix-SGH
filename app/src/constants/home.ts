/** Avisos de las acciones de «Inicio» cuyo backend llega en una fase posterior. */
export const COMING_SOON = {
  newTask: {
    title: 'Nueva tarea',
    message: 'Crear y asignar tareas llegará con la fase de Tareas.',
  },
  broadcast: {
    title: 'Difundir aviso',
    message: 'Los avisos masivos por notificación push llegarán con la fase de Notificaciones.',
  },
  report: {
    title: 'Reporte semanal',
    message: 'Los reportes de asistencia y horas llegarán con la fase de Reportes.',
  },
  project: {
    title: 'Proyectar el código QR',
    message: 'Podrás proyectar el QR cuando esté disponible el registro de asistencia por QR.',
  },
  history: {
    title: 'Historial de asistencias',
    message: 'El historial completo llegará con la fase de Asistencia.',
  },
} as const;

export type ComingSoonFeature = (typeof COMING_SOON)[keyof typeof COMING_SOON];
