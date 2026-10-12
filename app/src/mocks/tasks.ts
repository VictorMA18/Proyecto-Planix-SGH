import type {
  Attachment,
  Subtask,
  TaskActivity,
  TaskComment,
  TaskFormInput,
  TaskPriority,
  TaskStatus,
} from '@/schemas/task.schema';

// Tareas de ejemplo de la pestaña «Tareas» (Fase 3, sin backend todavía). Funciona como una base de
// datos en memoria por organización: se siembra una vez con tareas de la semana anterior, la actual y
// la siguiente, y se pueden crear, editar, duplicar, eliminar y comentar hasta reiniciar la app.
// Solo lo consume `services/tasks.ts`, con la forma de los contratos proyectados.

export interface MockMember {
  id: string;
  nombre: string;
  avatarUrl: string | null;
}

interface TaskRecord {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: TaskPriority;
  estado: TaskStatus;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  etiquetas: string[];
  miembroIds: string[];
  subtareas: Subtask[];
  adjuntos: Attachment[];
  creadaPorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrgStore {
  tasks: Map<string, TaskRecord>;
  comments: Map<string, TaskComment[]>;
  activity: Map<string, TaskActivity[]>;
}

const MINUTE = 60_000;
const DAY = 86_400_000;
const stores = new Map<string, OrgStore>();
let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++sequence}`;

const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDIENTE: 'Por hacer',
  EN_PROGRESO: 'En progreso',
  REVISION: 'Revisión',
  COMPLETADA: 'Completada',
};

const TEMPLATES = [
  {
    titulo: 'Inspección de sistemas de acceso',
    etiquetas: ['Seguridad'],
    subtareas: ['Revisar torniquetes', 'Probar tarjetas de visitas', 'Registrar incidencias'],
  },
  {
    titulo: 'Actualizar reporte de inventario mensual',
    etiquetas: ['Inventario'],
    subtareas: ['Conteo de estantes A-C', 'Conciliar diferencias', 'Enviar reporte a jefatura'],
  },
  {
    titulo: 'Reunión de coordinación de supervisores',
    etiquetas: ['Operaciones'],
    subtareas: [],
  },
  {
    titulo: 'Implementación campaña marketing Q1',
    etiquetas: ['Diseño', 'Marketing'],
    subtareas: [
      'Definir KPIs y objetivos cuantitativos',
      'Aprobar copys creativos con el equipo legal',
      'Subir assets al repositorio institucional',
      'Reportar métricas preliminares al lead de marketing',
      'Lanzar pauta segmentada de re-targeting',
    ],
  },
  {
    titulo: 'Capacitación en protocolo de evacuación',
    etiquetas: ['Capacitación', 'Seguridad'],
    subtareas: ['Preparar material', 'Convocar al turno mañana'],
  },
  {
    titulo: 'Calibración de balanzas',
    etiquetas: ['Calidad'],
    subtareas: ['Balanza 1', 'Balanza 2', 'Firmar certificado'],
  },
];
const LOCATIONS = ['Torno Norte', 'Depósito Central', 'Sala B', 'Almacén Zona 2', 'Línea B', null];
const DESCRIPTION =
  'Esta tarea forma parte del plan del mes. **Revisa las subtareas** antes de empezar y deja evidencia en los adjuntos.\n\n- Coordina con tu supervisor\n- Registra cualquier _incidencia_';

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (fecha: string, hora: string) => {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
};

/** Estado coherente con la hora: lo pasado casi siempre terminado, lo de ahora en progreso. */
function seedStatus(start: number, end: number, now: number, s: number): TaskStatus {
  if (end < now) return s % 6 === 0 ? 'PENDIENTE' : s % 6 === 1 ? 'REVISION' : 'COMPLETADA';
  if (start <= now) return 'EN_PROGRESO';
  return 'PENDIENTE';
}

function seed(organizationId: string, members: MockMember[], myId: string | undefined, now: number): OrgStore {
  const store: OrgStore = { tasks: new Map(), comments: new Map(), activity: new Map() };
  const today = new Date(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const from = new Date(monday.getTime() - 7 * DAY);

  // Semana anterior, actual y siguiente.
  for (let i = 0; i < 21; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const key = dateKey(day);
    const daySeed = hash(`${organizationId}:${key}`);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const count = weekend ? daySeed % 2 : 1 + (daySeed % 3);

    for (let n = 0; n < count; n++) {
      const s = hash(`${key}:${n}:${organizationId}`);
      const template = TEMPLATES[s % TEMPLATES.length];
      const startMin = (8 + ((s >>> 3) % 9)) * 60 + ((s >>> 7) % 2) * 30;
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() + startMin * MINUTE;
      const end = start + (60 + ((s >>> 5) % 4) * 30) * MINUTE;
      const estado = seedStatus(start, end, now, s);
      const done = estado === 'COMPLETADA' ? template.subtareas.length : estado === 'PENDIENTE' ? 0 : Math.ceil(template.subtareas.length / 2);

      const size = Math.min(members.length, 1 + (s % 3));
      const offset = members.length ? s % members.length : 0;
      const ids = Array.from({ length: size }, (_, k) => members[(offset + k) % members.length]?.id).filter(Boolean) as string[];
      if (myId && s % 2 === 0 && !ids.includes(myId)) ids[0] = myId;
      const creator = members[(s >>> 2) % Math.max(1, members.length)];
      const id = `tarea-${key}-${n}`;
      const createdAt = new Date(start - 2 * DAY).toISOString();

      store.tasks.set(id, {
        id,
        titulo: template.titulo,
        descripcion: s % 4 === 0 ? null : DESCRIPTION,
        prioridad: s % 4 === 0 ? 'ALTA' : s % 5 === 0 ? 'BAJA' : 'MEDIA',
        estado,
        fechaInicio: new Date(start).toISOString(),
        fechaFin: new Date(end).toISOString(),
        ubicacion: LOCATIONS[(s >>> 4) % LOCATIONS.length],
        etiquetas: template.etiquetas,
        miembroIds: [...new Set(ids)],
        subtareas: template.subtareas.map((titulo, k) => ({ id: `${id}-st-${k}`, titulo, completada: k < done })),
        adjuntos:
          s % 3 === 0
            ? [
                {
                  id: `${id}-adj-1`,
                  tipo: 'ARCHIVO',
                  nombreArchivo: 'Guia_de_procedimiento.pdf',
                  mimeType: 'application/pdf',
                  tamanoBytes: 2_400_000,
                  url: 'https://example.com/guia.pdf',
                },
              ]
            : [],
        creadaPorId: creator?.id ?? null,
        createdAt,
        updatedAt: createdAt,
      });

      const comments: TaskComment[] = [];
      const commenters = members.filter((m) => ids.includes(m.id));
      if (s % 3 !== 2 && commenters.length) {
        comments.push({
          id: `${id}-c-1`,
          autor: person(commenters[0]),
          texto: '¿Alguien tiene el formato actualizado? Lo necesito antes de empezar.',
          createdAt: new Date(start - DAY).toISOString(),
        });
        if (creator) {
          comments.push({
            id: `${id}-c-2`,
            autor: person(creator),
            texto: 'Lo dejé en los adjuntos. Cualquier duda me escriben por aquí.',
            createdAt: new Date(start - DAY + 45 * MINUTE).toISOString(),
          });
        }
      }
      store.comments.set(id, comments);

      const activity: TaskActivity[] = [
        { id: `${id}-a-1`, tipo: 'CREADA', actor: person(creator), descripcion: 'creó la tarea', createdAt },
      ];
      if (estado !== 'PENDIENTE') {
        activity.push({
          id: `${id}-a-2`,
          tipo: 'ESTADO',
          actor: person(members.find((m) => m.id === ids[0])),
          descripcion: `movió la tarea a ${STATUS_LABEL[estado]}`,
          createdAt: new Date(Math.min(now, start + 30 * MINUTE)).toISOString(),
        });
      }
      store.activity.set(id, activity.reverse());
    }
  }
  return store;
}

function person(member: MockMember | undefined) {
  return { miembroId: member?.id ?? null, nombre: member?.nombre ?? 'Administración', avatarUrl: member?.avatarUrl ?? null };
}

function storeFor(organizationId: string, members: MockMember[], myId: string | undefined, now = Date.now()) {
  let store = stores.get(organizationId);
  if (!store) {
    store = seed(organizationId, members, myId, now);
    stores.set(organizationId, store);
  }
  return store;
}

function project(store: OrgStore, task: TaskRecord, members: MockMember[], myId: string | undefined) {
  const byId = new Map(members.map((m) => [m.id, m]));
  return {
    id: task.id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    prioridad: task.prioridad,
    estado: task.estado,
    fechaInicio: task.fechaInicio,
    fechaFin: task.fechaFin,
    ubicacion: task.ubicacion,
    etiquetas: task.etiquetas,
    asignados: task.miembroIds
      .map((id) => byId.get(id))
      .filter((m): m is MockMember => !!m)
      .map((m) => ({ miembroId: m.id, nombre: m.nombre, avatarUrl: m.avatarUrl })),
    asignadaAMi: !!myId && task.miembroIds.includes(myId),
    subtareas: { completadas: task.subtareas.filter((st) => st.completada).length, total: task.subtareas.length },
    comentarios: store.comments.get(task.id)?.length ?? 0,
    creadaPor: person(task.creadaPorId ? byId.get(task.creadaPorId) : undefined),
  };
}

function detail(store: OrgStore, task: TaskRecord, members: MockMember[], myId: string | undefined) {
  return {
    ...project(store, task, members, myId),
    listaSubtareas: task.subtareas,
    adjuntos: task.adjuntos,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function log(store: OrgStore, taskId: string, actor: MockMember | undefined, tipo: TaskActivity['tipo'], descripcion: string) {
  const list = store.activity.get(taskId) ?? [];
  list.unshift({ id: nextId('act'), tipo, actor: person(actor), descripcion, createdAt: new Date().toISOString() });
  store.activity.set(taskId, list);
}

function getRecord(store: OrgStore, id: string) {
  const task = store.tasks.get(id);
  if (!task) throw new Error('La tarea ya no existe.');
  return task;
}

export interface MockContext {
  organizationId: string;
  members: MockMember[];
  myId: string | undefined;
}

const ctxStore = (ctx: MockContext) => storeFor(ctx.organizationId, ctx.members, ctx.myId);
const me = (ctx: MockContext) => ctx.members.find((m) => m.id === ctx.myId);

/** GET /organizaciones/{id}/tareas?desde&hasta */
export function mockListTasks(ctx: MockContext, desde: string, hasta: string) {
  const store = ctxStore(ctx);
  return [...store.tasks.values()]
    .filter((task) => {
      const day = dateKey(new Date(task.fechaInicio));
      return day >= desde && day <= hasta;
    })
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .map((task) => project(store, task, ctx.members, ctx.myId));
}

/** GET /tareas/{id} */
export function mockGetTask(ctx: MockContext, id: string) {
  const store = ctxStore(ctx);
  return detail(store, getRecord(store, id), ctx.members, ctx.myId);
}

/** PATCH /tareas/{id}/estado */
export function mockSetTaskStatus(ctx: MockContext, id: string, estado: TaskStatus) {
  const store = ctxStore(ctx);
  const task = getRecord(store, id);
  if (task.estado !== estado) {
    task.estado = estado;
    task.updatedAt = new Date().toISOString();
    log(store, id, me(ctx), 'ESTADO', `movió la tarea a ${STATUS_LABEL[estado]}`);
  }
  return detail(store, task, ctx.members, ctx.myId);
}

/** PATCH /tareas/{id}/subtareas/{subtareaId} */
export function mockToggleSubtask(ctx: MockContext, id: string, subtaskId: string, completada: boolean) {
  const store = ctxStore(ctx);
  const task = getRecord(store, id);
  const subtask = task.subtareas.find((st) => st.id === subtaskId);
  if (!subtask) throw new Error('La subtarea ya no existe.');
  subtask.completada = completada;
  log(store, id, me(ctx), 'SUBTAREA', `${completada ? 'completó' : 'reabrió'} «${subtask.titulo}»`);
  return detail(store, task, ctx.members, ctx.myId);
}

/** POST /organizaciones/{id}/tareas · PATCH /tareas/{id} */
export function mockSaveTask(ctx: MockContext, form: TaskFormInput, id?: string) {
  const store = ctxStore(ctx);
  const now = new Date().toISOString();
  const fields = {
    titulo: form.titulo,
    descripcion: form.descripcion || null,
    prioridad: form.prioridad,
    estado: form.estado,
    fechaInicio: at(form.fecha, form.horaInicio),
    fechaFin: form.horaFin ? at(form.fecha, form.horaFin) : null,
    ubicacion: form.ubicacion || null,
    etiquetas: form.etiquetas,
    miembroIds: form.miembroIds,
    subtareas: form.subtareas.map((st) => ({ id: st.id ?? nextId('st'), titulo: st.titulo, completada: st.completada })),
    adjuntos: form.adjuntos,
  };

  if (id) {
    const task = getRecord(store, id);
    const changes = describeChanges(task, fields, ctx.members, ctx.myId);
    Object.assign(task, fields, { updatedAt: now });
    for (const change of changes) log(store, id, me(ctx), change.tipo, change.descripcion);
    return detail(store, task, ctx.members, ctx.myId);
  }

  const task: TaskRecord = { id: nextId('tarea'), ...fields, creadaPorId: ctx.myId ?? null, createdAt: now, updatedAt: now };
  store.tasks.set(task.id, task);
  store.comments.set(task.id, []);
  store.activity.set(task.id, []);
  log(store, task.id, me(ctx), 'CREADA', 'creó la tarea');
  return detail(store, task, ctx.members, ctx.myId);
}

const PRIORITY_LABEL: Record<TaskPriority, string> = { ALTA: 'Alta', MEDIA: 'Normal', BAJA: 'Baja' };

const scheduleText = (inicio: string, fin: string | null) => {
  const day = new Date(inicio).toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
  const hour = (iso: string) => {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return `${day}, ${hour(inicio)}${fin ? ` - ${hour(fin)}` : ''}`;
};

/** Un evento de actividad por cada cambio concreto de la edición (como hará el backend). */
function describeChanges(
  before: TaskRecord,
  after: Omit<TaskRecord, 'id' | 'creadaPorId' | 'createdAt' | 'updatedAt'>,
  members: MockMember[],
  actorId: string | undefined,
) {
  const changes: { tipo: TaskActivity['tipo']; descripcion: string }[] = [];
  const add = (tipo: TaskActivity['tipo'], descripcion: string) => changes.push({ tipo, descripcion });
  const name = (memberId: string) => members.find((m) => m.id === memberId)?.nombre ?? 'un miembro';

  if (before.titulo !== after.titulo) add('EDITADA', `cambió el título a «${after.titulo}»`);
  if (before.estado !== after.estado) add('ESTADO', `movió la tarea a ${STATUS_LABEL[after.estado]}`);
  if (before.prioridad !== after.prioridad) add('EDITADA', `cambió la prioridad a ${PRIORITY_LABEL[after.prioridad]}`);
  if (before.fechaInicio !== after.fechaInicio || before.fechaFin !== after.fechaFin) {
    add('EDITADA', `cambió el horario a ${scheduleText(after.fechaInicio, after.fechaFin)}`);
  }
  if (before.ubicacion !== after.ubicacion) {
    add('EDITADA', after.ubicacion ? `cambió la ubicación a «${after.ubicacion}»` : 'quitó la ubicación');
  }
  if ((before.descripcion ?? '') !== (after.descripcion ?? '')) add('EDITADA', 'actualizó la descripción');

  for (const tag of after.etiquetas.filter((t) => !before.etiquetas.includes(t))) add('EDITADA', `añadió la etiqueta «${tag}»`);
  for (const tag of before.etiquetas.filter((t) => !after.etiquetas.includes(t))) add('EDITADA', `quitó la etiqueta «${tag}»`);

  for (const id of after.miembroIds.filter((m) => !before.miembroIds.includes(m))) {
    add('ASIGNADOS', id === actorId ? 'se asignó la tarea' : `asignó a ${name(id)}`);
  }
  for (const id of before.miembroIds.filter((m) => !after.miembroIds.includes(m))) {
    add('ASIGNADOS', id === actorId ? 'se quitó de la tarea' : `quitó a ${name(id)}`);
  }

  const previous = new Map(before.subtareas.map((st) => [st.id, st]));
  for (const st of after.subtareas) {
    const old = previous.get(st.id);
    if (!old) add('SUBTAREA', `añadió la subtarea «${st.titulo}»`);
    else {
      if (old.titulo !== st.titulo) add('SUBTAREA', `renombró «${old.titulo}» a «${st.titulo}»`);
      if (old.completada !== st.completada) add('SUBTAREA', `${st.completada ? 'completó' : 'reabrió'} «${st.titulo}»`);
    }
  }
  const kept = new Set(after.subtareas.map((st) => st.id));
  for (const st of before.subtareas.filter((st) => !kept.has(st.id))) add('SUBTAREA', `eliminó la subtarea «${st.titulo}»`);

  const files = new Set(before.adjuntos.map((f) => f.id));
  for (const file of after.adjuntos.filter((f) => !files.has(f.id))) add('ADJUNTO', `adjuntó «${file.nombreArchivo}»`);
  const keptFiles = new Set(after.adjuntos.map((f) => f.id));
  for (const file of before.adjuntos.filter((f) => !keptFiles.has(f.id))) add('ADJUNTO', `quitó el adjunto «${file.nombreArchivo}»`);

  return changes;
}

/** POST /tareas/{id}/duplicar */
export function mockDuplicateTask(ctx: MockContext, id: string) {
  const store = ctxStore(ctx);
  const original = getRecord(store, id);
  const now = new Date().toISOString();
  const copy: TaskRecord = {
    ...original,
    id: nextId('tarea'),
    titulo: `${original.titulo} (copia)`.slice(0, 200),
    estado: 'PENDIENTE',
    subtareas: original.subtareas.map((st) => ({ ...st, id: nextId('st'), completada: false })),
    adjuntos: [...original.adjuntos],
    creadaPorId: ctx.myId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.tasks.set(copy.id, copy);
  store.comments.set(copy.id, []);
  store.activity.set(copy.id, []);
  log(store, copy.id, me(ctx), 'DUPLICADA', `duplicó «${original.titulo}»`);
  return detail(store, copy, ctx.members, ctx.myId);
}

/** DELETE /tareas/{id} */
export function mockDeleteTask(ctx: MockContext, id: string) {
  const store = ctxStore(ctx);
  getRecord(store, id);
  store.tasks.delete(id);
  store.comments.delete(id);
  store.activity.delete(id);
}

/** GET /tareas/{id}/comentarios */
export function mockListComments(ctx: MockContext, id: string) {
  const store = ctxStore(ctx);
  getRecord(store, id);
  return [...(store.comments.get(id) ?? [])];
}

/** POST /tareas/{id}/comentarios */
export function mockAddComment(ctx: MockContext, id: string, texto: string) {
  const store = ctxStore(ctx);
  getRecord(store, id);
  const comment: TaskComment = { id: nextId('com'), autor: person(me(ctx)), texto, createdAt: new Date().toISOString() };
  store.comments.set(id, [...(store.comments.get(id) ?? []), comment]);
  log(store, id, me(ctx), 'COMENTARIO', 'comentó la tarea');
  return comment;
}

/** GET /tareas/{id}/actividad */
export function mockListActivity(ctx: MockContext, id: string) {
  const store = ctxStore(ctx);
  getRecord(store, id);
  return [...(store.activity.get(id) ?? [])];
}
