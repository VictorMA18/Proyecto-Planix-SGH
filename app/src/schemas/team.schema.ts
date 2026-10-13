import { z } from 'zod';

// Esquemas de «Equipo y Miembros». Las formas de respuesta coinciden con el contrato
// proyectado en api/openapi.yaml (PaginaEquipo, MiembroEquipo, InvitacionPendiente, CodigoInvitacion).

export const teamRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLEADO']);
export type TeamRole = z.infer<typeof teamRoleSchema>;

/** Roles que se pueden asignar al invitar (no existe invitación a SUPER_ADMIN). */
export const inviteRoleSchema = z.enum(['ADMIN', 'SUPERVISOR', 'EMPLEADO'], {
  error: 'Selecciona un rol.',
});
export type InviteRole = z.infer<typeof inviteRoleSchema>;

export const teamMemberSchema = z.object({
  tipo: z.literal('MIEMBRO'),
  id: z.string(),
  nombre: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  rol: teamRoleSchema,
  estado: z.enum(['ACTIVO', 'INVITADO', 'INACTIVO']),
  /** Plantilla de turno asignada. */
  turno: z.string().nullable(),
  /** Hora de su última entrada, si está dentro ahora. */
  enTurnoDesde: z.iso.datetime().nullable(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamInvitationSchema = z.object({
  tipo: z.literal('INVITACION'),
  id: z.string(),
  // Si la persona ya tiene cuenta se muestra su nombre; si no, solo el correo.
  nombre: z.string().optional(),
  email: z.email(),
  rol: teamRoleSchema,
  enviadaEn: z.iso.datetime(),
  expiraEn: z.iso.datetime(),
});
export type TeamInvitation = z.infer<typeof teamInvitationSchema>;

export const teamItemSchema = z.discriminatedUnion('tipo', [teamMemberSchema, teamInvitationSchema]);
export type TeamItem = z.infer<typeof teamItemSchema>;

export const teamFilterSchema = z.enum(['TODOS', 'ADMIN', 'SUPERVISOR', 'EMPLEADO', 'PENDIENTES']);
export type TeamFilter = z.infer<typeof teamFilterSchema>;

export const teamCountsSchema = z.object({
  todos: z.number().int(),
  admins: z.number().int(),
  supervisores: z.number().int(),
  empleados: z.number().int(),
  pendientes: z.number().int(),
});
export type TeamCounts = z.infer<typeof teamCountsSchema>;

export const teamPageSchema = z.object({
  items: z.array(teamItemSchema),
  total: z.number().int(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  conteos: teamCountsSchema,
});
export type TeamPage = z.infer<typeof teamPageSchema>;

export interface TeamQuery {
  search: string;
  filter: TeamFilter;
  page: number;
}

export const invitationCodeSchema = z.object({
  codigo: z.string(),
  rol: teamRoleSchema,
  expiraEn: z.iso.datetime(),
});
export type InvitationCode = z.infer<typeof invitationCodeSchema>;

/** Respuesta de `POST /organizaciones/{id}/invitaciones`: la invitación creada con su `token`. */
export const personalInvitationCreatedSchema = z.object({
  token: z.string(),
  rol: teamRoleSchema,
  expiraEn: z.iso.datetime(),
});

// ---- Perfil de un miembro ----

/** Respuesta de `GET /organizaciones/{id}/miembros/{miembroId}` (también del `PATCH` de rol). */
export const memberProfileSchema = z.object({
  id: z.string(),
  usuario: z.object({
    id: z.string(),
    nombre: z.string(),
    email: z.email(),
    emailVerificado: z.boolean(),
    avatarUrl: z.string().nullable(),
  }),
  rol: teamRoleSchema,
  estado: z.enum(['ACTIVO', 'INVITADO', 'INACTIVO']),
  fechaIngreso: z.iso.datetime().nullable(),
});
export type MemberProfile = z.infer<typeof memberProfileSchema>;

/** Credencial y métricas del mes de un miembro (contrato ResumenMiembro). */
export const memberSummarySchema = z.object({
  /** Mes en curso, `YYYY-MM`. */
  periodo: z.string(),
  turno: z.object({ nombre: z.string(), horaInicio: z.string(), horaFin: z.string() }).nullable(),
  entradaHoy: z.iso.datetime().nullable(),
  /** Porcentaje de jornadas puntuales del mes; `null` si no hay ninguna evaluada. */
  puntualidad: z.number().min(0).max(100).nullable(),
  /** Horas trabajadas en el mes, la meta del turno y la variación frente a la semana anterior. */
  horas: z.object({ trabajadas: z.number().min(0), meta: z.number().min(0), variacionSemana: z.number() }),
  tareas: z.object({ completadas: z.number().int(), total: z.number().int() }),
});
export type MemberSummary = z.infer<typeof memberSummarySchema>;

export const changeRoleSchema = z.object({ rol: inviteRoleSchema });
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

// ---- Formularios de invitación ----

export const personalInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .pipe(z.email('Ingresa un correo electrónico válido.')),
  rol: inviteRoleSchema,
});
export type PersonalInviteInput = z.input<typeof personalInviteSchema>;

/** Vigencia del código genérico, en minutos. */
export const VIGENCIA_OPTIONS = [5, 10, 15] as const;
export const DEFAULT_VIGENCIA_MINUTOS = 10;

export const genericCodeSchema = z.object({
  rol: inviteRoleSchema,
  vigenciaMinutos: z.literal([...VIGENCIA_OPTIONS], { error: 'Selecciona la vigencia.' }),
});
export type GenericCodeInput = z.infer<typeof genericCodeSchema>;
