import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

describe('QR dinámico (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  const url = () => `/organizaciones/${e.orgId}/qr/hoy`;

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'qr', { empleado: 'EMPLEADO', ajeno: null });
    t.reloj.fijar('2026-10-09T13:05:00Z'); // viernes 08:05 en Lima
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await t.app.close();
  });

  it('el ADMIN obtiene el QR vigente del día', async () => {
    const res = await t.http.get(url()).set(como(e.clerk.admin)).expect(200);

    expect(res.body).toMatchObject({ fecha: '2026-10-09', ventanaSeg: 120 });
    expect(res.body.token).toMatch(/^PLX1\.[0-9a-f-]{36}\.\d+\.[0-9a-f]{20}$/);
    const vence = new Date(res.body.expiraEn).getTime();
    expect(vence).toBeGreaterThan(t.reloj.ahora().getTime());
    expect(vence - t.reloj.ahora().getTime()).toBeLessThanOrEqual(120_000);
  });

  it('el token se mantiene dentro de la ventana y rota al cambiar de ventana', async () => {
    const pedir = async () =>
      (await t.http.get(url()).set(como(e.clerk.admin)).expect(200)).body
        .token as string;
    const primero = await pedir();
    expect(await pedir()).toBe(primero);
    t.reloj.avanzarMin(3);
    expect(await pedir()).not.toBe(primero);
    expect(
      await t.prisma.codigoQR.count({ where: { organizacionId: e.orgId } }),
    ).toBe(1);
  });

  it('crea un QR nuevo al cambiar de día', async () => {
    t.reloj.fijar('2026-10-10T13:05:00Z');
    const res = await t.http.get(url()).set(como(e.clerk.admin)).expect(200);
    expect(res.body.fecha).toBe('2026-10-10');
    expect(
      await t.prisma.codigoQR.count({ where: { organizacionId: e.orgId } }),
    ).toBe(2);
  });

  it('solo lo ve un ADMIN de la organización', async () => {
    await t.http.get(url()).set(como(e.clerk.empleado)).expect(403);
    await t.http.get(url()).set(como(e.clerk.ajeno)).expect(404);
    await t.http
      .get('/organizaciones/no-es-uuid/qr/hoy')
      .set(como(e.clerk.admin))
      .expect(400);
    await t.http.get(url()).expect(401);
  });
});
