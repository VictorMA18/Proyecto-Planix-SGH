import type { Test } from 'supertest';
import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

/** Parser de supertest que recibe la respuesta en crudo (no el texto). */
type ParserCrudo = Exclude<
  Parameters<Test['parse']>[0],
  (texto: string) => unknown
>;

/** Lee el cuerpo binario (PDF/XLSX) como Buffer. */
const binario: ParserCrudo = (res, listo) => {
  const partes: Buffer[] = [];
  res.on('data', (parte: Buffer) => partes.push(parte));
  res.on('end', () => listo(null, Buffer.concat(partes)));
};

describe('Métricas y reporte exportable (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;

  const SEMANA = { periodo: 'SEMANA', fecha: '2026-10-15' };
  const MES = { periodo: 'MES', fecha: '2026-10-15' };

  const metricas = (quien: string, query: object) =>
    t.http
      .get(`/organizaciones/${e.orgId}/metricas`)
      .query(query)
      .set(como(quien));

  /** Entrada y salida de `clerk` con el reloj en esos instantes. */
  async function jornada(clerk: string, entrada: string, salida: string) {
    t.reloj.fijar(entrada);
    const token = (
      await t.http
        .get(`/organizaciones/${e.orgId}/qr/hoy`)
        .set(como(e.clerk.admin))
        .expect(200)
    ).body.token as string;
    await t.http
      .post('/asistencia/entrada')
      .set(como(clerk))
      .send({ token })
      .expect(201);
    t.reloj.fijar(salida);
    await t.http
      .post('/asistencia/salida')
      .set(como(clerk))
      .send({ organizacionId: e.orgId })
      .expect(200);
  }

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'metricas', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
      empleado2: 'EMPLEADO',
      ajeno: null,
    });
    otra = await crearEscenario(t, 'metricas_otra', {});

    await t.http
      .post(`/organizaciones/${e.orgId}/turnos`)
      .set(como(e.clerk.admin))
      .send({
        nombre: 'Turno Mañana',
        horaInicio: '08:00',
        horaFin: '17:00',
        dias: [1, 2, 3, 4, 5],
        miembroIds: [e.miembro.empleado],
      })
      .expect(201);

    // Lunes 5 (semana anterior): 08:00–17:00 → 9 h, puntual.
    await jornada(
      e.clerk.empleado,
      '2026-10-05T13:00:00Z',
      '2026-10-05T22:00:00Z',
    );
    // Lunes 12: 08:30–18:30 → 10 h (1 h extra), tarde.
    await jornada(
      e.clerk.empleado,
      '2026-10-12T13:30:00Z',
      '2026-10-12T23:30:00Z',
    );
    // Lunes 12: el admin, sin turno, 09:00–11:00 → 2 h.
    await jornada(
      e.clerk.admin,
      '2026-10-12T14:00:00Z',
      '2026-10-12T16:00:00Z',
    );
    // Miércoles 14: 08:05–12:05 → 4 h, puntual.
    await jornada(
      e.clerk.empleado,
      '2026-10-14T13:05:00Z',
      '2026-10-14T17:05:00Z',
    );

    await t.http
      .post(`/organizaciones/${e.orgId}/tareas`)
      .set(como(e.clerk.admin))
      .send({
        titulo: 'Inventario de farmacia',
        prioridad: 'MEDIA',
        fechaInicio: '2026-10-13T15:00:00.000Z',
        fechaFin: '2026-10-13T16:00:00.000Z',
        miembroIds: [e.miembro.empleado],
      })
      .expect(201);

    // Hoy: jueves 15 de octubre, 12:00 en Lima.
    t.reloj.fijar('2026-10-15T17:00:00Z');
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  it('calcula las métricas del equipo en la semana', async () => {
    const { body } = await metricas(e.clerk.admin, SEMANA).expect(200);
    expect(body).toMatchObject({
      periodo: { tipo: 'SEMANA', desde: '2026-10-12', hasta: '2026-10-18' },
      alcance: 'EQUIPO',
      miembro: null,
      miembrosActivos: 4,
      horas: {
        trabajadas: 16,
        planificadas: 45, // solo el empleado tiene turno: 5 días × 9 h
        restantes: 29,
        cumplimientoPct: 35.6,
      },
      puntualidad: {
        porcentaje: 50,
        aTiempo: 1,
        evaluadas: 2,
        nivel: 'MEJORABLE',
      },
      horasExtra: { total: 1, hoy: 0 },
      tendencia: {
        promedioDiarioHoras: 8, // 16 h en 2 días con actividad
        variacionPct: 77.8, // frente a lun 5 – jue 8: 9 h
        metaDiariaHoras: 9,
        mejor: { etiqueta: 'Lunes', horas: 12, variacionPct: 33.3 },
      },
      registroDiario: null,
      tareas: null,
    });
    expect(
      body.tendencia.barras.map((b: { horas: number }) => b.horas),
    ).toEqual([12, 0, 4, 0, 0, 0, 0]);
    expect(body.colaboradores.total).toBe(4);
    expect(body.colaboradores.top).toHaveLength(3);
    expect(body.colaboradores.top[0]).toEqual({
      miembroId: e.miembro.empleado,
      nombre: 'Empleado E2E',
      email: expect.any(String) as string,
      avatarUrl: null,
      rol: 'EMPLEADO',
      turno: 'Turno Mañana',
      diasTrabajados: 2,
      asistenciaPct: 50, // 2 de 4 días de turno hasta el jueves
      puntualidadPct: 50,
      horas: 14,
      horasExtra: 1,
      metaAlcanzada: false,
    });
    expect(
      body.colaboradores.top.map((c: { nombre: string }) => c.nombre),
    ).toEqual(['Empleado E2E', 'Admin E2E', 'Empleado2 E2E']);
  });

  it('en el mes no hay variación sin horas en el mes anterior', async () => {
    const { body } = await metricas(e.clerk.admin, MES).expect(200);
    expect(body.periodo).toEqual({
      tipo: 'MES',
      desde: '2026-10-01',
      hasta: '2026-10-31',
    });
    expect(body.horas).toMatchObject({ trabajadas: 25, planificadas: 198 });
    expect(body.tendencia.variacionPct).toBeNull();
    expect(body.tendencia.barras).toHaveLength(5);
  });

  it('métricas individuales con registro diario y tareas', async () => {
    const { body } = await metricas(e.clerk.admin, {
      ...SEMANA,
      miembroId: e.miembro.empleado,
    }).expect(200);
    expect(body).toMatchObject({
      alcance: 'MIEMBRO',
      miembro: {
        miembroId: e.miembro.empleado,
        nombre: 'Empleado E2E',
        rol: 'EMPLEADO',
        turno: 'Turno Mañana',
      },
      miembrosActivos: 1,
      horas: { trabajadas: 14, planificadas: 45 },
      colaboradores: null,
      tareas: { completadas: 0, total: 1 },
    });
    expect(
      body.registroDiario.map((d: { fecha: string; horas: number }) => [
        d.fecha,
        d.horas,
      ]),
    ).toEqual([
      ['2026-10-15', 0],
      ['2026-10-14', 4],
      ['2026-10-13', 0],
      ['2026-10-12', 10],
    ]);
    expect(body.registroDiario[3]).toMatchObject({
      conTurno: true,
      entrada: '2026-10-12T13:30:00.000Z',
      salida: '2026-10-12T23:30:00.000Z',
      puntual: false,
      minutosTarde: 30,
      horasExtra: 1,
      marcas: 2,
      escaneos: [
        { tipo: 'ENTRADA', hora: '2026-10-12T13:30:00.000Z' },
        { tipo: 'SALIDA', hora: '2026-10-12T23:30:00.000Z' },
      ],
    });
  });

  it('el equipo y los demás miembros solo los ve un ADMIN', async () => {
    await metricas(e.clerk.empleado, {
      ...SEMANA,
      miembroId: e.miembro.empleado,
    }).expect(200);
    await metricas(e.clerk.empleado, SEMANA).expect(403);
    await metricas(e.clerk.empleado, {
      ...SEMANA,
      miembroId: e.miembro.empleado2,
    }).expect(403);
    await metricas(e.clerk.supervisor, SEMANA).expect(403);
    await metricas(e.clerk.ajeno, SEMANA).expect(404);
    await metricas(e.clerk.admin, {
      ...SEMANA,
      miembroId: otra.miembro.admin,
    }).expect(404);
  });

  it('rechaza periodos, fechas o miembros inválidos', async () => {
    await metricas(e.clerk.admin, {
      periodo: 'DIA',
      fecha: '2026-10-15',
    }).expect(400);
    await metricas(e.clerk.admin, {
      periodo: 'MES',
      fecha: '2026-02-30',
    }).expect(400);
    await metricas(e.clerk.admin, { periodo: 'MES' }).expect(400);
    await metricas(e.clerk.admin, { ...SEMANA, miembroId: 'abc' }).expect(400);
  });

  it('lista los colaboradores paginados y con búsqueda', async () => {
    const lista = (quien: string, query: object) =>
      t.http
        .get(`/organizaciones/${e.orgId}/metricas/colaboradores`)
        .query({ ...SEMANA, ...query })
        .set(como(quien));

    const { body } = await lista(e.clerk.admin, { pageSize: 2 }).expect(200);
    expect(body).toMatchObject({ total: 4, page: 1, pageSize: 2 });
    expect(body.items.map((c: { nombre: string }) => c.nombre)).toEqual([
      'Empleado E2E',
      'Admin E2E',
    ]);

    const pagina2 = await lista(e.clerk.admin, { pageSize: 2, page: 2 }).expect(
      200,
    );
    expect(pagina2.body.items.map((c: { nombre: string }) => c.nombre)).toEqual(
      ['Empleado2 E2E', 'Supervisor E2E'],
    );

    const busqueda = await lista(e.clerk.admin, { q: 'SUPERVÍSOR' }).expect(
      200,
    );
    expect(busqueda.body.total).toBe(1);

    await lista(e.clerk.empleado, {}).expect(403);
    await lista(e.clerk.admin, { pageSize: 51 }).expect(400);
  });

  it('descarga el reporte en PDF y en Excel', async () => {
    const reporte = (quien: string, query: object) =>
      t.http
        .get(`/organizaciones/${e.orgId}/metricas/reporte`)
        .query({ ...SEMANA, ...query })
        .set(como(quien))
        .buffer(true)
        .parse(binario);

    const pdf = await reporte(e.clerk.admin, { formato: 'PDF' }).expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.headers['content-disposition']).toMatch(
      /^attachment; filename="planix-reporte-e2e-metricas-.+-2026-10-12_2026-10-18\.pdf"$/,
    );
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');

    const xlsx = await reporte(e.clerk.admin, { formato: 'XLSX' }).expect(200);
    expect(xlsx.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    // Un .xlsx es un ZIP.
    expect((xlsx.body as Buffer).subarray(0, 2).toString()).toBe('PK');

    // El propio empleado puede bajar el suyo, pero no el del equipo.
    const propio = await reporte(e.clerk.empleado, {
      formato: 'PDF',
      miembroId: e.miembro.empleado,
    }).expect(200);
    expect(propio.headers['content-disposition']).toContain(
      'planix-reporte-empleado-e2e-',
    );
    await reporte(e.clerk.empleado, { formato: 'PDF' }).expect(403);
    await reporte(e.clerk.admin, { formato: 'CSV' }).expect(400);
  });
});
