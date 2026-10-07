import type {
  GenericCodeInput,
  InviteRole,
  TeamCounts,
  TeamFilter,
  TeamInvitation,
  TeamItem,
  TeamMember,
  TeamRole,
} from '@/schemas/team.schema';

// Backend simulado en memoria de «Equipo y Miembros». Reemplaza a los endpoints proyectados
// (api/openapi.yaml) y solo lo consume `services/team.ts`: al existir la API real se borra este archivo.

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const NOMBRES = ['Valentina', 'Diego', 'Camila', 'Andrés', 'Renata', 'Joaquín', 'Paula', 'Iván', 'Daniela', 'Sebastián', 'Fernanda', 'Rodrigo'];
const APELLIDOS = ['Rojas', 'Paredes', 'Quispe', 'Salazar', 'Herrera', 'Castillo', 'Vega', 'Mendoza', 'Flores', 'Navarro', 'Ramos', 'Torres'];
const TURNOS = ['Línea A • Matutino', 'Línea B • Vespertino', 'Almacén • Rotativo', 'Planta • Nocturno'];

const iso = (ms: number) => new Date(ms).toISOString();

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function buildSeed(now: number): TeamItem[] {
  const miembro = (m: Omit<TeamMember, 'tipo' | 'avatarUrl' | 'estado'>): TeamMember => ({
    tipo: 'MIEMBRO',
    avatarUrl: null,
    estado: 'ACTIVO',
    ...m,
  });

  const fijos: TeamMember[] = [
    miembro({ id: 'm-sofia', nombre: 'Sofía Morales', email: 'sofia.morales@acme.corp', rol: 'SUPERVISOR' }),
    miembro({
      id: 'm-carlos',
      nombre: 'Carlos Méndez',
      email: 'carlos.m@acme.corp',
      rol: 'EMPLEADO',
      turno: 'Línea A • Matutino',
      enTurnoDesde: iso(now - (5 * HOUR + 22 * MINUTE)),
    }),
    miembro({ id: 'm-mateo', nombre: 'Mateo Vargas', email: 'mateo.v@acme.corp', rol: 'ADMIN' }),
  ];

  // Relleno determinista: 2 admins, 5 supervisores y 35 empleados más (45 miembros en total).
  const roles: TeamRole[] = [
    ...Array<TeamRole>(2).fill('ADMIN'),
    ...Array<TeamRole>(5).fill('SUPERVISOR'),
    ...Array<TeamRole>(35).fill('EMPLEADO'),
  ];
  const generados = roles.map((rol, i): TeamMember => {
    const nombre = NOMBRES[i % NOMBRES.length];
    const apellido = APELLIDOS[(i * 5 + 3) % APELLIDOS.length];
    return miembro({
      id: `m-${i + 4}`,
      nombre: `${nombre} ${apellido}`,
      email: `${normalizar(nombre)}.${normalizar(apellido)}${i + 4}@acme.corp`,
      rol,
      ...(rol === 'EMPLEADO' && i % 3 === 0
        ? {
            turno: TURNOS[i % TURNOS.length],
            enTurnoDesde: iso(now - (2 * HOUR + ((i * 7) % 50) * MINUTE)),
          }
        : {}),
    });
  });

  const invitacion = (i: { id: string; nombre?: string; email: string; rol: TeamRole; dias: number }): TeamInvitation => ({
    tipo: 'INVITACION',
    id: i.id,
    nombre: i.nombre,
    email: i.email,
    rol: i.rol,
    enviadaEn: iso(now - i.dias * DAY),
    expiraEn: iso(now + (7 - i.dias) * DAY),
  });

  const lucia = invitacion({ id: 'i-lucia', nombre: 'Lucía Domínguez', email: 'lucia.dominguez@acme.corp', rol: 'EMPLEADO', dias: 2 });
  const pendientes = [
    invitacion({ id: 'i-2', email: 'nuevo.supervisor@acme.corp', rol: 'SUPERVISOR', dias: 5 }),
    invitacion({ id: 'i-3', email: 'practicante@acme.corp', rol: 'EMPLEADO', dias: 1 }),
  ];

  // Mismo orden que la captura: tres miembros, la invitación de Lucía y después el resto.
  return [...fijos, lucia, ...generados, ...pendientes];
}

const stores = new Map<string, TeamItem[]>();

function getStore(organizationId: string): TeamItem[] {
  let items = stores.get(organizationId);
  if (!items) {
    items = buildSeed(Date.now());
    stores.set(organizationId, items);
  }
  return items;
}

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function nombreMostrado(item: TeamItem): string {
  return item.tipo === 'INVITACION' ? (item.nombre ?? item.email) : item.nombre;
}

function coincideFiltro(item: TeamItem, filter: TeamFilter): boolean {
  switch (filter) {
    case 'TODOS':
      return true;
    case 'PENDIENTES':
      return item.tipo === 'INVITACION';
    case 'ADMIN':
      return item.tipo === 'MIEMBRO' && (item.rol === 'ADMIN' || item.rol === 'SUPER_ADMIN');
    case 'SUPERVISOR':
      return item.tipo === 'MIEMBRO' && item.rol === 'SUPERVISOR';
    case 'EMPLEADO':
      return item.tipo === 'MIEMBRO' && item.rol === 'EMPLEADO';
  }
}

function contar(items: TeamItem[]): TeamCounts {
  const count = (filter: TeamFilter) => items.filter((i) => coincideFiltro(i, filter)).length;
  return {
    todos: items.length,
    admins: count('ADMIN'),
    supervisores: count('SUPERVISOR'),
    empleados: count('EMPLEADO'),
    pendientes: count('PENDIENTES'),
  };
}

function generarCodigo(): string {
  return Array.from({ length: 10 }, () => ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)]).join('');
}

export const mockTeamBackend = {
  /** GET /organizaciones/{id}/equipo */
  async list(organizationId: string, params: { search: string; filter: TeamFilter; page: number; pageSize: number }) {
    await delay();
    const items = getStore(organizationId);
    const query = normalizar(params.search.trim());

    const filtrados = items.filter(
      (item) =>
        coincideFiltro(item, params.filter) &&
        (!query || normalizar(nombreMostrado(item)).includes(query) || normalizar(item.email).includes(query)),
    );
    const start = (params.page - 1) * params.pageSize;

    return {
      items: filtrados.slice(start, start + params.pageSize),
      total: filtrados.length,
      page: params.page,
      pageSize: params.pageSize,
      conteos: contar(items),
    };
  },

  /** POST /organizaciones/{id}/invitaciones (invitación personal: correo + rol) */
  async createPersonalInvitation(organizationId: string, input: { email: string; rol: InviteRole }) {
    await delay(500);
    const items = getStore(organizationId);
    const email = input.email.trim().toLowerCase();

    if (items.some((item) => item.email.toLowerCase() === email)) {
      throw new Error('Ese correo ya pertenece al equipo o tiene una invitación pendiente.');
    }

    const now = Date.now();
    items.unshift({
      tipo: 'INVITACION',
      id: `i-${now}`,
      email,
      rol: input.rol,
      enviadaEn: iso(now),
      expiraEn: iso(now + 7 * DAY),
    });
    return { codigo: generarCodigo(), rol: input.rol, expiraEn: iso(now + 7 * DAY) };
  },

  /** POST /organizaciones/{id}/codigos-invitacion (código genérico: rol + vigencia) */
  async createGenericCode(_organizationId: string, input: GenericCodeInput) {
    await delay(500);
    return {
      codigo: generarCodigo(),
      rol: input.rol,
      expiraEn: iso(Date.now() + input.vigenciaMinutos * MINUTE),
    };
  },

  /** POST /invitaciones/{id}/reenviar */
  async resendInvitation(organizationId: string, invitationId: string) {
    await delay(500);
    const items = getStore(organizationId);
    const index = items.findIndex((item) => item.tipo === 'INVITACION' && item.id === invitationId);
    if (index === -1) throw new Error('La invitación ya no existe.');

    const now = Date.now();
    const actual = items[index] as TeamInvitation;
    const renovada: TeamInvitation = { ...actual, enviadaEn: iso(now), expiraEn: iso(now + 7 * DAY) };
    items[index] = renovada;
    return renovada;
  },
};
