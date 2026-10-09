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
} as const;

export type ComingSoonFeature = (typeof COMING_SOON)[keyof typeof COMING_SOON];
