import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('Asistencia: entrada, salida, hoy e historial (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;

  const qr = async (escenario = e) =>
    (
      await t.http
        .get(`/organizaciones/${escenario.orgId}/qr/hoy`)
        .set(como(escenario.clerk.admin))
        .expect(200)
    ).body.token as string;
  const entrar = (token: string, quien = e.clerk.empleado) =>
    t.http.post('/asistencia/entrada').set(como(quien)).send({ token });
  const salir = (quien = e.clerk.empleado) =>
    t.http
      .post('/asistencia/salida')
      .set(como(quien))
      .send({ organizacionId: e.orgId });
  const hoy = (quien = e.clerk.empleado) =>
    t.http.get(`/asistencia/hoy?organizacionId=${e.orgId}`).set(como(quien));

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'asis', { empleado: 'EMPLEADO', ajeno: null });
    otra = await crearEscenario(t, 'asis_otra', {});
    t.reloj.fijar('2026-10-09T13:05:00Z'); // viernes 08:05 en Lima
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  it('sin entrada, «hoy» responde con la jornada vacía', async () => {
    const res = await hoy().expect(200);
    expect(res.body).toMatchObject({
      fecha: '2026-10-09',
      toleranciaMin: 15,
      turno: null,
      jornada: null,
    });
  });

  it('rechaza QR mal formados, alterados o vencidos', async () => {
    await entrar('hola').expect(400);
    await entrar('').expect(400);
    const token = await qr();
    await entrar(
      `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`,
    ).expect(400);

    t.reloj.avanzarMin(5); // dos ventanas después ya no vale
    const res = await entrar(token).expect(400);
    expect(res.body.message).toMatch(/QR no es válido o ya expiró/);
  });

  it('acepta el QR de la ventana anterior como margen', async () => {
    const token = await qr();
    t.reloj.avanzarMin(2);
    const res = await entrar(token).expect(201);
    expect(res.body).toMatchObject({
      fecha: '2026-10-09',
      estadoActual: 'DENTRO',
      horaFin: null,
      turno: null,
      puntual: null,
      minutosTrabajados: 0,
    });
    expect(res.body.movimientos).toHaveLength(1);
  });

  it('no permite dos entradas seguidas', async () => {
    const res = await entrar(await qr()).expect(400);
    expect(res.body.message).toMatch(/entrada abierta/);
  });

  it('registra la salida con la hora del servidor y no permite repetirla', async () => {
    t.reloj.avanzarMin(240);
    const res = await salir().expect(200);
    expect(res.body).toMatchObject({
      estadoActual: 'FUERA',
      minutosTrabajados: 240,
    });
    expect(new Date(res.body.horaFin).toISOString()).toBe(
      t.reloj.ahora().toISOString(),
    );
    await salir().expect(404);
  });

  it('el retorno vuelve a pedir un QR vigente y suma sobre la misma jornada', async () => {
    t.reloj.avanzarMin(60);
    const res = await entrar(await qr()).expect(201);
    expect(res.body.estadoActual).toBe('DENTRO');
    expect(res.body.movimientos.map((m: { tipo: string }) => m.tipo)).toEqual([
      'ENTRADA',
      'SALIDA',
      'ENTRADA',
    ]);

    t.reloj.avanzarMin(60);
    const actual = await hoy().expect(200);
    expect(actual.body.jornada).toMatchObject({
      estadoActual: 'DENTRO',
      minutosTrabajados: 300,
    });
    expect(
      await t.prisma.jornadaAsistencia.count({
        where: { organizacionId: e.orgId },
      }),
    ).toBe(1);
  });

  it('si le asignan un turno después de entrar, «hoy» muestra el turno sin evaluar la puntualidad', async () => {
    await t.http
      .post(`/organizaciones/${e.orgId}/turnos`)
      .set(como(e.clerk.admin))
      .send({
        nombre: 'Turno Viernes',
        horaInicio: '08:00',
        horaFin: '17:00',
        dias: [5],
        miembroIds: [e.miembro.empleado],
      })
      .expect(201);

    const res = await hoy().expect(200);
    expect(res.body.turno).toMatchObject({
      nombre: 'Turno Viernes',
      objetivoMin: 540,
    });
    expect(res.body.jornada).toMatchObject({ turno: null, puntual: null });

    const inicio = await t.http
      .get(`/organizaciones/${e.orgId}/inicio/mio`)
      .set(como(e.clerk.empleado))
      .expect(200);
    expect(inicio.body.turno.nombre).toBe('Turno Viernes');
    expect(inicio.body.entrada.puntual).toBeNull();
  });

  it('el QR de una organización a la que no pertenece no sirve', async () => {
    await entrar(await qr(otra)).expect(404);
    await entrar(await qr(), e.clerk.ajeno).expect(404);
  });

  it('valida el cuerpo de la salida y la organización de «hoy»', async () => {
    await t.http
      .post('/asistencia/salida')
      .set(como(e.clerk.empleado))
      .send({})
      .expect(400);
    await t.http
      .post('/asistencia/salida')
      .set(como(e.clerk.empleado))
      .send({ organizacionId: e.orgId, horaSalida: '2026-10-09T10:00:00Z' })
      .expect(400);
    await t.http.get('/asistencia/hoy').set(como(e.clerk.empleado)).expect(400);
    await hoy(e.clerk.ajeno).expect(404);
  });

  it('al día siguiente empieza una jornada nueva y el historial lista ambas', async () => {
    await salir().expect(200);
    t.reloj.fijar('2026-10-10T14:00:00Z');
    expect((await hoy().expect(200)).body.jornada).toBeNull();
    await entrar(await qr()).expect(201);

    const res = await t.http
      .get(`/asistencia/historial?organizacionId=${e.orgId}&pageSize=1`)
      .set(como(e.clerk.empleado))
      .expect(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(res.body.data[0].fecha).toBe('2026-10-10');

    const filtrado = await t.http
      .get(
        `/asistencia/historial?organizacionId=${e.orgId}&desde=2026-10-09&hasta=2026-10-09`,
      )
      .set(como(e.clerk.empleado))
      .expect(200);
    expect(filtrado.body.total).toBe(1);
    expect(filtrado.body.data[0].minutosTrabajados).toBe(300);

    await t.http
      .get(
        `/asistencia/historial?organizacionId=${e.orgId}&desde=2026-10-10&hasta=2026-10-01`,
      )
      .set(como(e.clerk.empleado))
      .expect(400);
  });
});
