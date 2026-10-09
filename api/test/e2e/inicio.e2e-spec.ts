import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('Inicio: jornada propia y panel del equipo (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;

  const qr = async () =>
    (
      await t.http
        .get(`/organizaciones/${e.orgId}/qr/hoy`)
        .set(como(e.clerk.admin))
        .expect(200)
    ).body.token as string;
  // El token se pide antes de crear la petición de entrada: supertest abre el servidor al crearla.
  const entrar = async (quien: string) => {
    const token = await qr();
    return t.http
      .post('/asistencia/entrada')
      .set(como(quien))
      .send({ token })
      .expect(201);
  };
  const mio = (quien: string) =>
    t.http.get(`/organizaciones/${e.orgId}/inicio/mio`).set(como(quien));
  const panel = (quien: string) =>
    t.http.get(`/organizaciones/${e.orgId}/inicio/panel`).set(como(quien));

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'inicio', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
    });
    await t.http
      .post(`/organizaciones/${e.orgId}/turnos`)
      .set(como(e.clerk.admin))
      .send({
        nombre: 'Turno Mañana',
        horaInicio: '08:00',
        horaFin: '17:00',
        dias: [1, 2, 3, 4, 5],
        miembroIds: [e.miembro.empleado, e.miembro.supervisor],
      })
      .expect(201);

    // Semana anterior: el empleado trabajó 2 horas el viernes 2 de octubre.
    t.reloj.fijar('2026-10-02T13:00:00Z');
    await entrar(e.clerk.empleado);
    t.reloj.avanzarMin(120);
    await t.http
      .post('/asistencia/salida')
      .set(como(e.clerk.empleado))
      .send({ organizacionId: e.orgId })
      .expect(200);
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await t.app.close();
  });

  it('sin entrada muestra el turno de hoy y el estado FUERA', async () => {
    t.reloj.fijar('2026-10-09T12:50:00Z'); // viernes 07:50 en Lima
    const res = await mio(e.clerk.empleado).expect(200);
    expect(res.body).toMatchObject({
      fecha: '2026-10-09',
      estado: 'FUERA',
      entrada: null,
      minutosTrabajados: 0,
      turno: { nombre: 'Turno Mañana', objetivoMin: 540 },
    });
    expect(res.body.turno.inicio).toBe('2026-10-09T13:00:00.000Z');
  });

  it('evalúa la puntualidad con la tolerancia y resume la semana', async () => {
    t.reloj.fijar('2026-10-09T13:05:00Z'); // 08:05: dentro de los 15 min de tolerancia
    await entrar(e.clerk.empleado);
    t.reloj.fijar('2026-10-09T13:30:00Z'); // 08:30: tarde
    await entrar(e.clerk.supervisor);

    t.reloj.fijar('2026-10-09T14:05:00Z');
    const res = await mio(e.clerk.empleado).expect(200);
    expect(res.body).toMatchObject({
      estado: 'DENTRO',
      entrada: { puntual: true, minutosTarde: 5 },
      minutosTrabajados: 60,
      semana: {
        minutosTrabajados: 60,
        diasTrabajados: 1,
        variacionPct: -50,
        puntualidad: 100,
      },
    });

    const supervisor = await mio(e.clerk.supervisor).expect(200);
    expect(supervisor.body.entrada).toMatchObject({
      puntual: false,
      minutosTarde: 30,
    });
  });

  it('el ADMIN ve la presencia del equipo y el QR', async () => {
    const res = await panel(e.clerk.admin).expect(200);
    expect(res.body.qr.token).toMatch(/^PLX1\./);
    expect(res.body.presencia).toEqual({
      esperados: 2,
      presentes: 2,
      puntuales: 1,
      retrasos: 1,
      pendientes: 0,
    });
    expect(
      res.body.asistenciasRecientes.map((a: { estado: string }) => a.estado),
    ).toEqual(['TARDE', 'PUNTUAL']);
    expect(res.body.asistenciasRecientes[0]).toMatchObject({
      miembroId: e.miembro.supervisor,
      area: 'Turno Mañana',
      minutosTarde: 30,
    });
    const viernes = res.body.puntualidadSemanal.dias.find(
      (d: { dia: string }) => d.dia === 'V',
    );
    expect(viernes).toEqual({ dia: 'V', fecha: '2026-10-09', valor: 50 });
    expect(res.body.puntualidadSemanal.dias[0].valor).toBeNull();
  });

  it('el SUPERVISOR ve la presencia sin QR; el EMPLEADO no ve el panel', async () => {
    const res = await panel(e.clerk.supervisor).expect(200);
    expect(res.body.qr).toBeNull();
    expect(res.body.presencia.presentes).toBe(2);
    await panel(e.clerk.empleado).expect(403);
  });
});
