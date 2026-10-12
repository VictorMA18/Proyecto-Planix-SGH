import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveOrganization } from '@/hooks/use-active-membership';
import {
  mockAddComment,
  mockDeleteTask,
  mockDuplicateTask,
  mockGetTask,
  mockListActivity,
  mockListComments,
  mockListTasks,
  mockSaveTask,
  mockSetTaskStatus,
  mockToggleSubtask,
  type MockContext,
} from '@/mocks/tasks';
import {
  calendarTasksSchema,
  taskActivitySchema,
  taskCommentSchema,
  taskDetailSchema,
  type TaskFormInput,
  type TaskStatus,
} from '@/schemas/task.schema';
import { teamPageSchema, type TeamMember } from '@/schemas/team.schema';
import { monthRange } from '@/utils/tasks';

import { useApiClient } from './api-client';

// Capa de servicio de la pestaña «Tareas». Las tareas son de ejemplo (Fase 3 sin backend) con la
// forma de los contratos proyectados; las personas son miembros reales del equipo.

/** Crear, editar, duplicar y eliminar tareas (documentacion/05). Ver tareas: todos los roles. */
export const canCreateTasks = (role: string | undefined) =>
  role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPERVISOR';

const taskKeys = {
  all: ['tasks'] as const,
  members: (userId: string | null | undefined, orgId: string | undefined) => ['tasks', 'members', userId, orgId] as const,
  month: (userId: string | null | undefined, orgId: string | undefined, month: string) =>
    ['tasks', 'month', userId, orgId, month] as const,
  detail: (userId: string | null | undefined, orgId: string | undefined, id: string | undefined) =>
    ['tasks', 'detail', userId, orgId, id] as const,
  comments: (userId: string | null | undefined, orgId: string | undefined, id: string | undefined) =>
    ['tasks', 'comments', userId, orgId, id] as const,
  activity: (userId: string | null | undefined, orgId: string | undefined, id: string | undefined) =>
    ['tasks', 'activity', userId, orgId, id] as const,
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

/** Contexto del mock (organización, miembros reales y membresía propia). */
function useMockContext(): { ctx: MockContext | null; userId: string | null | undefined; orgId: string | undefined } {
  const { userId } = useAuth();
  const { organization, membership } = useActiveOrganization();
  const members = useTaskMembers();
  const ctx =
    organization && members.data
      ? {
          organizationId: organization.id,
          members: members.data.map((m) => ({ id: m.id, nombre: m.nombre, avatarUrl: m.avatarUrl })),
          myId: membership?.id,
        }
      : null;
  return { ctx, userId, orgId: organization?.id };
}

/** Tareas del mes visible del calendario (con los días vecinos que completan las semanas). */
export function useMonthTasks(month: string) {
  const { ctx, userId, orgId } = useMockContext();
  const { desde, hasta } = monthRange(month);

  return useQuery({
    queryKey: taskKeys.month(userId, orgId, month),
    // Backend (proyectado): GET /organizaciones/{organizacionId}/tareas?desde=…&hasta=… (todos los roles)
    queryFn: async () => calendarTasksSchema.parse(mockListTasks(ctx!, desde, hasta)),
    enabled: !!userId && !!ctx,
  });
}

/** Detalle de una tarea. */
export function useTask(taskId: string | undefined) {
  const { ctx, userId, orgId } = useMockContext();

  return useQuery({
    queryKey: taskKeys.detail(userId, orgId, taskId),
    // Backend (proyectado): GET /tareas/{tareaId}
    queryFn: async () => taskDetailSchema.parse(mockGetTask(ctx!, taskId!)),
    enabled: !!userId && !!ctx && !!taskId,
    retry: false,
  });
}

export function useTaskComments(taskId: string | undefined) {
  const { ctx, userId, orgId } = useMockContext();

  return useQuery({
    queryKey: taskKeys.comments(userId, orgId, taskId),
    // Backend (proyectado): GET /tareas/{tareaId}/comentarios
    queryFn: async () => taskCommentSchema.array().parse(mockListComments(ctx!, taskId!)),
    enabled: !!userId && !!ctx && !!taskId,
  });
}

export function useTaskActivity(taskId: string | undefined) {
  const { ctx, userId, orgId } = useMockContext();

  return useQuery({
    queryKey: taskKeys.activity(userId, orgId, taskId),
    // Backend (proyectado): GET /tareas/{tareaId}/actividad
    queryFn: async () => taskActivitySchema.array().parse(mockListActivity(ctx!, taskId!)),
    enabled: !!userId && !!ctx && !!taskId,
  });
}

/** Cualquier cambio en una tarea afecta al calendario, al detalle, a la actividad y a Inicio. */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['home', 'tasks'] }),
    ]);
}

function useTaskMutation<TVars, TResult>(run: (ctx: MockContext, vars: TVars) => TResult) {
  const { ctx } = useMockContext();
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: async (vars: TVars) => {
      if (!ctx) throw new Error('Aún se está cargando el equipo. Inténtalo de nuevo.');
      return run(ctx, vars);
    },
    onSuccess: invalidate,
  });
}

/** Mover la tarea por su flujo. Backend (proyectado): PATCH /tareas/{tareaId}/estado */
export const useSetTaskStatus = () =>
  useTaskMutation((ctx, { taskId, estado }: { taskId: string; estado: TaskStatus }) =>
    taskDetailSchema.parse(mockSetTaskStatus(ctx, taskId, estado)),
  );

/** Backend (proyectado): PATCH /tareas/{tareaId}/subtareas/{subtareaId} */
export const useToggleSubtask = () =>
  useTaskMutation((ctx, { taskId, subtaskId, completada }: { taskId: string; subtaskId: string; completada: boolean }) =>
    taskDetailSchema.parse(mockToggleSubtask(ctx, taskId, subtaskId, completada)),
  );

/** Backend (proyectado): POST /organizaciones/{organizacionId}/tareas · PATCH /tareas/{tareaId} */
export const useSaveTask = () =>
  useTaskMutation((ctx, { id, form }: { id?: string; form: TaskFormInput }) =>
    taskDetailSchema.parse(mockSaveTask(ctx, form, id)),
  );

/** Backend (proyectado): POST /tareas/{tareaId}/duplicar */
export const useDuplicateTask = () =>
  useTaskMutation((ctx, taskId: string) => taskDetailSchema.parse(mockDuplicateTask(ctx, taskId)));

/** Backend (proyectado): DELETE /tareas/{tareaId} */
export const useDeleteTask = () => useTaskMutation((ctx, taskId: string) => mockDeleteTask(ctx, taskId));

/** Backend (proyectado): POST /tareas/{tareaId}/comentarios */
export const useAddComment = () =>
  useTaskMutation((ctx, { taskId, texto }: { taskId: string; texto: string }) =>
    taskCommentSchema.parse(mockAddComment(ctx, taskId, texto)),
  );
