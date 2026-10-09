import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('Reporte de asistencia (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;

  const url = (query: string) =>
    `/organizaciones/${e.orgId}/reportes/asistencia?${query}`;
  const jornada = async (entrada: string, minutos: number) => {
    t.reloj.fijar(entrada);
    const token = (
      await t.http
        .get(`/organizaciones/${e.orgId}/qr/hoy`)
        .set(como(e.clerk.admin))
        .expect(200)
    ).body.token;
    await t.http
      .post('/asistencia/entrada')
      .set(como(e.clerk.empleado))
      .send({ token })
      .expect(201);
    t.reloj.avanzarMin(minutos);
    await t.http
      .post('/asistencia/salida')
      .set(como(e.clerk.empleado))
      .send({ organizacionId: e.orgId })
      .expect(200);
  };

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'reportes', { empleado: 'EMPLEADO' });
    await t.http
      .post(`/organizaciones/${e.orgId}/turnos`)
      .set(como(e.clerk.admin))
      .send({
        nombre: 'Mañana',
        horaInicio: '08:00',
        horaFin: '17:00',
        dias: [1, 2, 3, 4, 5],
        miembroIds: [e.miembro.empleado],
      })
      .expect(201);
    await jornada('2026-10-08T13:00:00Z', 480); // jueves 08:00, puntual, 8 h
    await jornada('2026-10-09T13:20:00Z', 240); // viernes 08:20, 20 min tarde, 4 h
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await t.app.close();
  });

  it('suma horas, días y puntualidad por miembro en el rango', async () => {
    const res = await t.http
      .get(url('desde=2026-10-05&hasta=2026-10-11'))
      .set(como(e.clerk.admin))
      .expect(200);
    expect(res.body).toMatchObject({
      desde: '2026-10-05',
      hasta: '2026-10-11',
      totalMinutos: 720,
    });
    const empleado = res.body.filas.find(
      (f: { miembroId: string }) => f.miembroId === e.miembro.empleado,
    );
    expect(empleado).toMatchObject({
      turno: 'Mañana',
      diasTrabajados: 2,
      minutosTrabajados: 720,
      puntuales: 1,
      tardanzas: 1,
      minutosTarde: 20,
    });
    const admin = res.body.filas.find(
      (f: { miembroId: string }) => f.miembroId === e.miembro.admin,
    );
    expect(admin).toMatchObject({ diasTrabajados: 0, minutosTrabajados: 0 });
  });

  it('filtra por día y por miembro', async () => {
    const dia = await t.http
      .get(url('desde=2026-10-09&hasta=2026-10-09'))
      .set(como(e.clerk.admin))
      .expect(200);
    expect(dia.body.totalMinutos).toBe(240);

    const uno = await t.http
      .get(
        url(
          `desde=2026-10-05&hasta=2026-10-11&miembroId=${e.miembro.empleado}`,
        ),
      )
      .set(como(e.clerk.admin))
      .expect(200);
    expect(uno.body.filas).toHaveLength(1);
  });

  it('valida el rango y los permisos', async () => {
    await t.http
      .get(url('desde=2026-10-11&hasta=2026-10-05'))
      .set(como(e.clerk.admin))
      .expect(400);
    await t.http
      .get(url('desde=2026-01-01&hasta=2026-10-05'))
      .set(como(e.clerk.admin))
      .expect(400);
    await t.http
      .get(url('desde=2026-10-05'))
      .set(como(e.clerk.admin))
      .expect(400);
    await t.http
      .get(url('desde=2026-10-05&hasta=2026-10-11'))
      .set(como(e.clerk.empleado))
      .expect(403);
  });
});
