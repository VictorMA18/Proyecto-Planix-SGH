import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('Turnos: plantillas, asignaciones y tolerancia (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;
  let mananaId: string;
  let tardeId: string;

  const base = () => `/organizaciones/${e.orgId}/turnos`;
  const plantilla = (extra: object = {}) => ({
    nombre: 'Turno Mañana',
    horaInicio: '08:00',
    horaFin: '17:00',
    dias: [5, 1, 2, 3, 4],
    miembroIds: [e.miembro.empleado],
    ...extra,
  });

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'turnos', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
    });
    otra = await crearEscenario(t, 'turnos_otra', {});
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  it('crea una plantilla y asigna a sus miembros', async () => {
    const res = await t.http
      .post(base())
      .set(como(e.clerk.admin))
      .send(plantilla())
      .expect(201);
    mananaId = res.body.id;
    expect(res.body).toMatchObject({
      nombre: 'Turno Mañana',
      horaInicio: '08:00',
      horaFin: '17:00',
      horas: 9,
      dias: [1, 2, 3, 4, 5],
      asignados: 1,
      miembroIds: [e.miembro.empleado],
    });
    expect(res.body.equipo[0]).toMatchObject({
      id: e.miembro.empleado,
      nombre: 'Empleado E2E',
    });
  });

  it('valida el horario, los días y que los miembros sean del equipo activo', async () => {
    const admin = como(e.clerk.admin);
    await t.http
      .post(base())
      .set(admin)
      .send(plantilla({ horaFin: '08:00' }))
      .expect(400);
    await t.http
      .post(base())
      .set(admin)
      .send(plantilla({ dias: [] }))
      .expect(400);
    await t.http
      .post(base())
      .set(admin)
      .send(plantilla({ horaInicio: '8:00' }))
      .expect(400);
    await t.http
      .post(base())
      .set(admin)
      .send(plantilla({ miembroIds: [otra.miembro.admin] }))
      .expect(400);
  });

  it('un miembro tiene un solo turno: asignarlo a otra plantilla lo mueve', async () => {
    const res = await t.http
      .post(base())
      .set(como(e.clerk.admin))
      .send(
        plantilla({
          nombre: 'Turno Noche',
          horaInicio: '22:00',
          horaFin: '06:00',
          miembroIds: [e.miembro.empleado, e.miembro.supervisor],
        }),
      )
      .expect(201);
    tardeId = res.body.id;
    expect(res.body).toMatchObject({ horas: 8, asignados: 2 });

    const config = await t.http
      .get(base())
      .set(como(e.clerk.admin))
      .expect(200);
    const manana = config.body.plantillas.find(
      (p: { id: string }) => p.id === mananaId,
    );
    expect(manana.asignados).toBe(0);
    expect(config.body.resumen).toEqual({
      activas: 2,
      cubiertos: 2,
      toleranciaMin: 15,
    });
  });

  it('edita la plantilla y reemplaza la lista de asignados', async () => {
    const res = await t.http
      .patch(`${base()}/${tardeId}`)
      .set(como(e.clerk.admin))
      .send(
        plantilla({
          nombre: 'Turno Tarde',
          horaInicio: '14:00',
          horaFin: '22:00',
          miembroIds: [e.miembro.supervisor],
        }),
      )
      .expect(200);
    expect(res.body).toMatchObject({
      nombre: 'Turno Tarde',
      asignados: 1,
      miembroIds: [e.miembro.supervisor],
    });

    const empleado = await t.prisma.miembroOrganizacion.findUniqueOrThrow({
      where: { id: e.miembro.empleado },
    });
    expect(empleado.plantillaTurnoId).toBeNull();
  });

  it('cambia la tolerancia de entrada', async () => {
    const res = await t.http
      .patch(`${base()}/tolerancia`)
      .set(como(e.clerk.admin))
      .send({ toleranciaMin: 10 })
      .expect(200);
    expect(res.body.resumen.toleranciaMin).toBe(10);
    await t.http
      .patch(`${base()}/tolerancia`)
      .set(como(e.clerk.admin))
      .send({ toleranciaMin: 121 })
      .expect(400);
  });

  it('elimina la plantilla y sus miembros quedan sin turno', async () => {
    await t.http
      .delete(`${base()}/${tardeId}`)
      .set(como(e.clerk.admin))
      .expect(204);
    await t.http
      .delete(`${base()}/${tardeId}`)
      .set(como(e.clerk.admin))
      .expect(404);
    const supervisor = await t.prisma.miembroOrganizacion.findUniqueOrThrow({
      where: { id: e.miembro.supervisor },
    });
    expect(supervisor.plantillaTurnoId).toBeNull();
  });

  it('solo un ADMIN gestiona los turnos, y solo los de su organización', async () => {
    await t.http.get(base()).set(como(e.clerk.empleado)).expect(403);
    await t.http
      .post(base())
      .set(como(e.clerk.supervisor))
      .send(plantilla())
      .expect(403);
    await t.http
      .patch(`${base()}/tolerancia`)
      .set(como(e.clerk.supervisor))
      .send({ toleranciaMin: 5 })
      .expect(403);
    await t.http
      .patch(`/organizaciones/${otra.orgId}/turnos/${mananaId}`)
      .set(como(otra.clerk.admin))
      .send(plantilla({ miembroIds: [] }))
      .expect(404);
  });
});
