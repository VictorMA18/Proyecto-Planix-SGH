import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  attachmentSchema,
  calendarTasksSchema,
  isLocalAttachment,
  subtaskSchema,
  taskActivitySchema,
  taskCommentSchema,
  taskDetailSchema,
  type Attachment,
  type TaskDetail,
  type TaskFormInput,
  type TaskStatus,
} from '@/schemas/task.schema';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';
import { fromDateKey, monthRange } from '@/utils/tasks';

import { useApiClient } from './api-client';

// Capa de servicio de la pestaña «Tareas» (Fase 3, contra la API real).

/** Crear, editar, duplicar y eliminar tareas (documentacion/05). Ver tareas: todos los roles. */
export const canCreateTasks = (role: string | undefined) =>
  role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERVISOR';

const taskKeys = {
  all: ['tasks'] as const,
  members: (userId: string | null | undefined, orgId: string | undefined) => ['tasks', 'members', userId, orgId] as const,
  month: (userId: string | null | undefined, orgId: string | undefined, month: string) =>
    ['tasks', 'month', userId, orgId, month] as const,
  detail: (userId: string | null | undefined, id: string | undefined) => ['tasks', 'detail', userId, id] as const,
  comments: (userId: string | null | undefined, id: string | undefined) => ['tasks', 'comments', userId, id] as const,
  activity: (userId: string | null | undefined, id: string | undefined) => ['tasks', 'activity', userId, id] as const,
};

/** Miembros activos del equipo: personas asignables y opciones del filtro «Miembro». */
export function useTaskMembers() {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();

  return useQuery({
    queryKey: taskKeys.members(userId, organization?.id),
    // GET /organizaciones/{organizacionId}/equipo
    queryFn: async () => {
      const page = teamPageSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/equipo?filtro=TODOS&page=1&pageSize=100`),
      );
      return page.items.filter((item): item is TeamMember => item.tipo === 'MIEMBRO' && item.estado === 'ACTIVO');
    },
    enabled: !!userId && !!organization?.id,
  });
}

/** Tareas del mes visible del calendario (con los días vecinos que completan las semanas). */
export function useMonthTasks(month: string) {
  const api = useApiClient();
  const { userId } = useAuth();
  const { organization } = useActiveOrganization();
  const { desde, hasta } = monthRange(month);

  return useQuery({
    queryKey: taskKeys.month(userId, organization?.id, month),
    // GET /organizaciones/{organizacionId}/tareas?desde=…&hasta=… (todos los roles)
    queryFn: async () =>
      calendarTasksSchema.parse(
        await api<unknown>(`/organizaciones/${organization!.id}/tareas?desde=${desde}&hasta=${hasta}`),
      ),
    enabled: !!userId && !!organization?.id,
  });
}

/** Detalle de una tarea. */
export function useTask(taskId: string | undefined) {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: taskKeys.detail(userId, taskId),
    // GET /tareas/{tareaId}
    queryFn: async () => taskDetailSchema.parse(await api<unknown>(`/tareas/${taskId}`)),
    enabled: !!userId && !!taskId,
    retry: false,
    // Otras personas mueven el estado o marcan subtareas: no se da por fresco mucho tiempo.
    staleTime: 15_000,
  });
}

export function useTaskComments(taskId: string | undefined) {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: taskKeys.comments(userId, taskId),
    // GET /tareas/{tareaId}/comentarios
    queryFn: async () => taskCommentSchema.array().parse(await api<unknown>(`/tareas/${taskId}/comentarios`)),
    enabled: !!userId && !!taskId,
    // Conversación en vivo: se pide al abrirla y cada 15 s mientras está en pantalla.
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useTaskActivity(taskId: string | undefined) {
  const api = useApiClient();
  const { userId } = useAuth();

  return useQuery({
    queryKey: taskKeys.activity(userId, taskId),
    // GET /tareas/{tareaId}/actividad
    queryFn: async () => taskActivitySchema.array().parse(await api<unknown>(`/tareas/${taskId}/actividad`)),
    enabled: !!userId && !!taskId,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/** Cualquier cambio en una tarea afecta al calendario, al detalle, a la actividad y a Inicio. */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
    ]);
}

/** Mover la tarea por su flujo (cualquier miembro). */
export function useSetTaskStatus() {
  const api = useApiClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    // PATCH /tareas/{tareaId}/estado
    mutationFn: async ({ taskId, estado }: { taskId: string; estado: TaskStatus }) =>
      taskDetailSchema.parse(await api<unknown>(`/tareas/${taskId}/estado`, { method: 'PATCH', body: { estado } })),
    onSuccess: invalidate,
  });
}

/** Marcar o desmarcar una subtarea (cualquier miembro). */
export function useToggleSubtask() {
  const api = useApiClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    // PATCH /tareas/{tareaId}/subtareas/{subtareaId}
    mutationFn: async ({ taskId, subtaskId, completada }: { taskId: string; subtaskId: string; completada: boolean }) =>
      subtaskSchema.parse(
        await api<unknown>(`/tareas/${taskId}/subtareas/${subtaskId}`, { method: 'PATCH', body: { completada } }),
      ),
    onSuccess: invalidate,
  });
}

/** Fecha local + `HH:mm` → instante ISO. */
const toIso = (fecha: string, hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  const date = fromDateKey(fecha);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

/** Cuerpo de crear/editar (CrearTareaInput). Las subtareas nuevas no llevan `id`. */
function taskBody(form: TaskFormInput) {
  return {
    titulo: form.titulo,
    descripcion: form.descripcion,
    estado: form.estado,
    prioridad: form.prioridad,
    fechaInicio: toIso(form.fecha, form.horaInicio),
    fechaFin: form.horaFin ? toIso(form.fecha, form.horaFin) : null,
    ubicacion: form.ubicacion,
    etiquetas: form.etiquetas,
    miembroIds: form.miembroIds,
    subtareas: form.subtareas.map((st) => ({ ...(st.id ? { id: st.id } : {}), titulo: st.titulo, completada: st.completada })),
  };
}

/**
 * `multipart/form-data` con el archivo: en la web, el `File` del selector; en el móvil, la parte
 * clásica de React Native `{ uri, name, type }`, que `api-client` envía con XMLHttpRequest.
 */
function attachmentForm(attachment: Attachment) {
  const data = new FormData();
  if (Platform.OS === 'web' && attachment.archivo) {
    data.append('archivo', attachment.archivo, attachment.nombreArchivo);
  } else {
    data.append('archivo', {
      uri: attachment.url,
      name: attachment.nombreArchivo,
      type: attachment.mimeType,
    } as unknown as Blob);
  }
  return data;
}

export interface SaveTaskResult {
  task: TaskDetail;
  /** Adjuntos que no se pudieron subir o quitar (la tarea sí quedó guardada). */
  failed: { nombre: string; motivo: string }[];
}

/**
 * Crea o edita una tarea y luego sincroniza sus adjuntos: sube los nuevos y quita los que se
 * sacaron. Si un archivo falla, la tarea queda guardada y se informa cuál no se pudo procesar.
 */
export function useSaveTask() {
  const api = useApiClient();
  const { organization } = useActiveOrganization();
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: async ({
      id,
      form,
      previousAttachments = [],
    }: {
      id?: string;
      form: TaskFormInput;
      previousAttachments?: Attachment[];
    }): Promise<SaveTaskResult> => {
      // POST /organizaciones/{organizacionId}/tareas · PATCH /tareas/{tareaId}
      const saved = taskDetailSchema.parse(
        await api<unknown>(id ? `/tareas/${id}` : `/organizaciones/${organization!.id}/tareas`, {
          method: id ? 'PATCH' : 'POST',
          body: taskBody(form),
        }),
      );

      const failed: SaveTaskResult['failed'] = [];
      const kept = new Set(form.adjuntos.map((a) => a.id));
      for (const removed of previousAttachments.filter((a) => !kept.has(a.id))) {
        try {
          // DELETE /tareas/{tareaId}/adjuntos/{adjuntoId}
          await api<void>(`/tareas/${saved.id}/adjuntos/${removed.id}`, { method: 'DELETE' });
        } catch (err) {
          failed.push({ nombre: removed.nombreArchivo, motivo: (err as Error).message });
        }
      }
      for (const local of form.adjuntos.filter(isLocalAttachment)) {
        try {
          // POST /tareas/{tareaId}/adjuntos (multipart)
          attachmentSchema.parse(
            await api<unknown>(`/tareas/${saved.id}/adjuntos`, { method: 'POST', formData: attachmentForm(local) }),
          );
        } catch (err) {
          failed.push({ nombre: local.nombreArchivo, motivo: (err as Error).message });
        }
      }

      const task = form.adjuntos.length || previousAttachments.length
        ? taskDetailSchema.parse(await api<unknown>(`/tareas/${saved.id}`))
        : saved;
      return { task, failed };
    },
    onSettled: invalidate,
  });
}

/** POST /tareas/{tareaId}/duplicar (ADMIN y SUPERVISOR). */
export function useDuplicateTask() {
  const api = useApiClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async (taskId: string) =>
      taskDetailSchema.parse(await api<unknown>(`/tareas/${taskId}/duplicar`, { method: 'POST' })),
    onSuccess: invalidate,
  });
}

/** DELETE /tareas/{tareaId} (ADMIN y SUPERVISOR). */
export function useDeleteTask() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api<void>(`/tareas/${taskId}`, { method: 'DELETE' });
    },
    onSuccess: async (_data, taskId) => {
      // El detalle ya no existe: se quita de la caché para no volver a pedirlo.
      queryClient.removeQueries({ queryKey: taskKeys.detail(userId, taskId) });
      await invalidate();
    },
  });
}

/** POST /tareas/{tareaId}/comentarios (cualquier miembro). */
export function useAddComment() {
  const api = useApiClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async ({ taskId, texto }: { taskId: string; texto: string }) =>
      taskCommentSchema.parse(await api<unknown>(`/tareas/${taskId}/comentarios`, { method: 'POST', body: { texto } })),
    onSuccess: invalidate,
  });
}
