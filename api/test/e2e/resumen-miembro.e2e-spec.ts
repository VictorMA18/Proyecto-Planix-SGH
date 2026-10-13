import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('Resumen de un miembro: credencial y métricas del mes (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;

  const resumen = (quien: string, miembro = e.miembro.empleado) =>
    t.http
      .get(`/organizaciones/${e.orgId}/miembros/${miembro}/resumen`)
      .set(como(quien));

  /** Entrada y salida del empleado con el reloj en `entrada` y luego en `salida`. */
  async function jornada(entrada: string, salida?: string) {
    t.reloj.fijar(entrada);
    const token = (
      await t.http
        .get(`/organizaciones/${e.orgId}/qr/hoy`)
        .set(como(e.clerk.admin))
        .expect(200)
    ).body.token as string;
    await t.http
      .post('/asistencia/entrada')
      .set(como(e.clerk.empleado))
      .send({ token })
      .expect(201);
    if (!salida) return;
    t.reloj.fijar(salida);
    await t.http
      .post('/asistencia/salida')
      .set(como(e.clerk.empleado))
      .send({ organizacionId: e.orgId })
      .expect(200);
  }

  const tarea = (titulo: string) =>
    t.http
      .post(`/organizaciones/${e.orgId}/tareas`)
      .set(como(e.clerk.admin))
      .send({
        titulo,
        prioridad: 'MEDIA',
        fechaInicio: '2026-10-07T15:00:00.000Z',
        fechaFin: '2026-10-07T16:00:00.000Z',
        miembroIds: [e.miembro.empleado],
      })
      .expect(201);

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'resumen', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
      empleado2: 'EMPLEADO',
      ajeno: null,
    });
    otra = await crearEscenario(t, 'resumen_otra', {});

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

    // Lunes 5: entra tarde (08:30) y sale a las 16:00 → 7,5 h.
    await jornada('2026-10-05T13:30:00Z', '2026-10-05T21:00:00Z');
    // Lunes 12 (hoy): entra puntual (08:05) y sale a las 12:05 → 4 h.
    await jornada('2026-10-12T13:05:00Z', '2026-10-12T17:05:00Z');

    const hecha = (await tarea('Revisar extintores')).body.id as string;
    await tarea('Ordenar el almacén');
    await t.http
      .patch(`/tareas/${hecha}/estado`)
      .set(como(e.clerk.empleado))
      .send({ estado: 'COMPLETADA' })
      .expect(200);
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  it('calcula la credencial y las métricas del mes en curso', async () => {
    const { body } = await resumen(e.clerk.admin).expect(200);
    expect(body).toEqual({
      periodo: '2026-10',
      turno: { nombre: 'Turno Mañana', horaInicio: '08:00', horaFin: '17:00' },
      entradaHoy: '2026-10-12T13:05:00.000Z',
      puntualidad: 50,
      horas: {
        trabajadas: 11.5,
        meta: 198, // 22 días de lunes a viernes × 9 h
        variacionSemana: -3.5, // 4 h este lunes frente a 7,5 h el lunes pasado
      },
      tareas: { completadas: 1, total: 2 },
    });
  });

  it('sin turno ni jornadas, devuelve valores vacíos', async () => {
    const { body } = await resumen(e.clerk.admin, e.miembro.empleado2).expect(
      200,
    );
    expect(body).toMatchObject({
      turno: null,
      entradaHoy: null,
      puntualidad: null,
      horas: { trabajadas: 0, meta: 0, variacionSemana: 0 },
      tareas: { completadas: 0, total: 0 },
    });
  });

  it('lo ven ADMIN, SUPERVISOR y el propio miembro; otro EMPLEADO no', async () => {
    await resumen(e.clerk.supervisor).expect(200);
    await resumen(e.clerk.empleado).expect(200);
    await resumen(e.clerk.empleado2).expect(403);
    await resumen(e.clerk.ajeno).expect(404);
    await resumen(e.clerk.admin, otra.miembro.admin).expect(404);
    await t.http
      .get(`/organizaciones/${e.orgId}/miembros/no-es-uuid/resumen`)
      .set(como(e.clerk.admin))
      .expect(400);
  });
});
