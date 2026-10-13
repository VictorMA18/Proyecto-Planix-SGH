import webpush from 'web-push';
import { RecordatoriosService } from '../../src/modules/notificaciones/services/recordatorios.service';
import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  contenido: string | null;
  referenciaId: string | null;
  actor: { id: string; nombre: string } | null;
  asistencia: { puntual: boolean; turno: string } | null;
  leida: boolean;
}

describe('Notificaciones: bandeja, preferencias, difusión, eventos, recordatorios y push (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;
  const usuario: Record<string, string> = {};

  const bandeja = async (quien: string, query = '') =>
    (
      await t.http
        .get(`/notificaciones?organizacionId=${e.orgId}${query}`)
        .set(como(e.clerk[quien]))
        .expect(200)
    ).body as Notificacion[];
  const deTipo = async (quien: string, tipo: string) =>
    (await bandeja(quien)).filter((n) => n.tipo === tipo);
  const crearTarea = (quien: string, miembros: string[]) =>
    t.http
      .post(`/organizaciones/${e.orgId}/tareas`)
      .set(como(e.clerk[quien]))
      .send({
        titulo: 'Inventario de bodega',
        prioridad: 'MEDIA',
        fechaInicio: '2026-10-12T16:00:00.000Z',
        fechaFin: '2026-10-12T18:00:00.000Z',
        miembroIds: miembros.map((m) => e.miembro[m]),
      })
      .expect(201);
  const preferencias = (quien: string, cambios: object) =>
    t.http
      .put('/me/preferencias-notificacion')
      .set(como(e.clerk[quien]))
      .send({
        push: true,
        recordatoriosFichaje: true,
        novedadesTareas: true,
        modoAlerta: 'SONIDO',
        ...cambios,
      });

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'notif', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
      empleado2: 'EMPLEADO',
      nuevo: null,
    });
    otra = await crearEscenario(t, 'notif_otra', { empleado: 'EMPLEADO' });
    for (const [clave, clerkId] of Object.entries(e.clerk)) {
      usuario[clave] = (
        await t.prisma.usuario.findUniqueOrThrow({ where: { clerkId } })
      ).id;
    }
    t.reloj.fijar('2026-10-12T15:00:00Z'); // lunes 10:00 en Lima
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  describe('preferencias', () => {
    it('devuelve los valores por defecto, valida y guarda', async () => {
      const inicial = await t.http
        .get('/me/preferencias-notificacion')
        .set(como(e.clerk.empleado2))
        .expect(200);
      expect(inicial.body).toEqual({
        push: true,
        recordatoriosFichaje: true,
        novedadesTareas: true,
        modoAlerta: 'SONIDO',
      });

      await preferencias('empleado2', { modoAlerta: 'FUERTE' }).expect(400);
      const guardadas = await preferencias('empleado2', {
        novedadesTareas: false,
        recordatoriosFichaje: false,
        modoAlerta: 'VIBRACION',
      }).expect(200);
      expect(guardadas.body).toMatchObject({
        novedadesTareas: false,
        modoAlerta: 'VIBRACION',
      });
    });
  });

  describe('tareas', () => {
    let tareaId: string;

    it('avisa a los asignados, no a quien crea la tarea, y encola el push', async () => {
      tareaId = (await crearTarea('supervisor', ['empleado', 'supervisor']))
        .body.id as string;

      const [aviso] = await deTipo('empleado', 'TAREA_ASIGNADA');
      expect(aviso).toMatchObject({
        titulo: 'Nueva tarea asignada',
        contenido: 'Supervisor E2E te asignó a «Inventario de bodega».',
        referenciaId: tareaId,
        actor: { nombre: 'Supervisor E2E' },
        leida: false,
      });
      expect(await deTipo('supervisor', 'TAREA_ASIGNADA')).toHaveLength(0);
      expect(t.cola.para(usuario.empleado).at(-1)?.datos).toMatchObject({
        tipo: 'TAREA_ASIGNADA',
        url: `/tarea/${tareaId}`,
      });
    });

    it('al editar, solo avisa a los nuevos asignados', async () => {
      await t.http
        .patch(`/tareas/${tareaId}`)
        .set(como(e.clerk.supervisor))
        .send({
          titulo: 'Inventario de bodega',
          prioridad: 'ALTA',
          fechaInicio: '2026-10-12T16:00:00.000Z',
          fechaFin: '2026-10-12T18:00:00.000Z',
          miembroIds: [e.miembro.empleado, e.miembro.empleado2],
        })
        .expect(200);
      expect(await deTipo('empleado', 'TAREA_ASIGNADA')).toHaveLength(1);
      expect(await deTipo('empleado2', 'TAREA_ASIGNADA')).toHaveLength(1);
    });

    it('las novedades van a asignados y creador, sin el actor y respetando la preferencia', async () => {
      await t.http
        .post(`/tareas/${tareaId}/comentarios`)
        .set(como(e.clerk.empleado))
        .send({ texto: 'Ya empecé con el pasillo A' })
        .expect(201);
      const [comentario] = await deTipo('supervisor', 'TAREA_ACTUALIZADA');
      expect(comentario).toMatchObject({
        titulo: 'Nuevo comentario',
        contenido:
          'Empleado E2E comentó en «Inventario de bodega»: «Ya empecé con el pasillo A».',
      });
      expect(await deTipo('empleado', 'TAREA_ACTUALIZADA')).toHaveLength(0);
      // empleado2 apagó «Novedades de tareas».
      expect(await deTipo('empleado2', 'TAREA_ACTUALIZADA')).toHaveLength(0);

      await t.http
        .patch(`/tareas/${tareaId}/estado`)
        .set(como(e.clerk.supervisor))
        .send({ estado: 'REVISION' })
        .expect(200);
      const [movida] = await deTipo('empleado', 'TAREA_ACTUALIZADA');
      expect(movida.titulo).toBe('Tarea movida a Revisión');
    });
  });

  describe('bandeja', () => {
    it('marca una o todas como leídas y no deja tocar las ajenas', async () => {
      const [primera] = await bandeja('empleado');
      const leida = await t.http
        .patch(`/notificaciones/${primera.id}/leer`)
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(leida.body).toMatchObject({ id: primera.id, leida: true });

      await t.http
        .patch(`/notificaciones/${primera.id}/leer`)
        .set(como(e.clerk.supervisor))
        .expect(404);
      await t.http
        .patch('/notificaciones/no-es-uuid/leer')
        .set(como(e.clerk.empleado))
        .expect(400);

      const todas = await t.http
        .patch(`/notificaciones/leer-todas?organizacionId=${e.orgId}`)
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(todas.body.actualizadas).toBeGreaterThan(0);
      expect(await bandeja('empleado', '&leida=false')).toHaveLength(0);
    });

    it('filtra por organización y valida la consulta', async () => {
      const ajena = await t.http
        .get(`/notificaciones?organizacionId=${otra.orgId}`)
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(ajena.body).toEqual([]);
      await t.http
        .get('/notificaciones?leida=quizas')
        .set(como(e.clerk.empleado))
        .expect(400);
    });
  });

  describe('difusión', () => {
    const difundir = (quien: string, cuerpo: object) =>
      t.http
        .post(`/organizaciones/${e.orgId}/notificaciones/difusion`)
        .set(como(e.clerk[quien]))
        .send({
          titulo: 'Reunión general',
          contenido: 'Viernes 9:00',
          ...cuerpo,
        });

    it('solo ADMIN o SUPERVISOR, y con destinatarios de la organización', async () => {
      await difundir('empleado', {}).expect(403);
      await difundir('admin', { miembroIds: [otra.miembro.empleado] }).expect(
        400,
      );
      await difundir('admin', { titulo: 'Hi' }).expect(400);
    });

    it('a los elegidos (más quien envía) o a todo el equipo', async () => {
      const elegidos = await difundir('admin', {
        miembroIds: [e.miembro.empleado],
      }).expect(201);
      expect(elegidos.body).toEqual({ notificacionesCreadas: 2 });
      const [aviso] = await deTipo('empleado', 'AVISO');
      expect(aviso).toMatchObject({
        titulo: 'Reunión general',
        contenido: 'Viernes 9:00',
        actor: { nombre: 'Admin E2E' },
      });
      expect(await deTipo('admin', 'AVISO')).toHaveLength(1);
      expect(await deTipo('empleado2', 'AVISO')).toHaveLength(0);

      const todos = await difundir('supervisor', {}).expect(201);
      expect(todos.body).toEqual({ notificacionesCreadas: 4 });
      expect(await deTipo('empleado2', 'AVISO')).toHaveLength(1);
    });
  });

  describe('turnos y asistencia', () => {
    let turnoId: string;
    const plantilla = (extra: object = {}) => ({
      nombre: 'Turno Mañana',
      horaInicio: '09:00',
      horaFin: '18:00',
      dias: [1, 2, 3, 4, 5],
      miembroIds: [e.miembro.empleado, e.miembro.empleado2],
      ...extra,
    });

    it('avisa a quien recibe un turno y a quien sigue cuando cambia', async () => {
      turnoId = (
        await t.http
          .post(`/organizaciones/${e.orgId}/turnos`)
          .set(como(e.clerk.admin))
          .send(plantilla())
          .expect(201)
      ).body.id as string;
      const [asignado] = await deTipo('empleado', 'TURNO_ASIGNADO');
      expect(asignado).toMatchObject({
        contenido:
          'Admin E2E te asignó el Turno Mañana (09:00 - 18:00), de lunes a viernes.',
        referenciaId: turnoId,
      });

      await t.http
        .patch(`/organizaciones/${e.orgId}/turnos/${turnoId}`)
        .set(como(e.clerk.admin))
        .send(plantilla({ horaInicio: '08:00', horaFin: '17:00' }))
        .expect(200);
      const [cambio] = await deTipo('empleado', 'TURNO_ACTUALIZADO');
      expect(cambio.titulo).toBe('Cambio en tu Turno Mañana');
      expect(await deTipo('empleado', 'TURNO_ASIGNADO')).toHaveLength(1);

      await t.http
        .patch(`/organizaciones/${e.orgId}/turnos/tolerancia`)
        .set(como(e.clerk.admin))
        .send({ toleranciaMin: 10 })
        .expect(200);
      const cambios = await deTipo('empleado2', 'TURNO_ACTUALIZADO');
      expect(cambios.map((n) => n.titulo)).toContain(
        'Tolerancia de entrada actualizada',
      );
    });

    it('la entrada queda en la bandeja con su puntualidad y sin push', async () => {
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

      const [registro] = await deTipo('empleado', 'ASISTENCIA_REGISTRADA');
      expect(registro).toMatchObject({
        titulo: 'Registro de asistencia exitoso',
        actor: null,
        asistencia: { puntual: false, turno: 'Turno Mañana (08:00 - 17:00)' },
      });
      expect(
        t.cola.mensajes.some((m) => m.datos.tipo === 'ASISTENCIA_REGISTRADA'),
      ).toBe(false);

      // El equipo muestra su turno y desde cuándo está dentro.
      const equipo = await t.http
        .get(`/organizaciones/${e.orgId}/equipo?pageSize=100`)
        .set(como(e.clerk.supervisor))
        .expect(200);
      const items = equipo.body.items as {
        id: string;
        turno: string | null;
        enTurnoDesde: string | null;
      }[];
      expect(items.find((i) => i.id === e.miembro.empleado)).toMatchObject({
        turno: 'Turno Mañana',
        enTurnoDesde: '2026-10-12T15:00:00.000Z',
      });
      expect(items.find((i) => i.id === e.miembro.supervisor)).toMatchObject({
        turno: null,
        enTurnoDesde: null,
      });
    });
  });

  describe('recordatorios', () => {
    const ejecutar = () => t.app.get(RecordatoriosService).ejecutar();

    it('recuerda la salida una sola vez a quien sigue dentro', async () => {
      t.reloj.fijar('2026-10-12T21:50:00Z'); // 16:50, el turno termina a las 17:00
      await ejecutar();
      await ejecutar();
      const recordatorios = await deTipo('empleado', 'RECORDATORIO_SALIDA');
      expect(recordatorios).toHaveLength(1);
      expect(recordatorios[0].contenido).toBe(
        'Tu Turno Mañana termina a las 17:00. Registra tu salida antes de irte.',
      );
    });

    it('recuerda la entrada a quien aún no entró, respetando la preferencia', async () => {
      t.reloj.fijar('2026-10-13T12:50:00Z'); // martes 07:50, el turno empieza a las 08:00
      await ejecutar();
      await ejecutar();
      const recordatorios = await deTipo('empleado', 'RECORDATORIO_ENTRADA');
      expect(recordatorios).toHaveLength(1);
      expect(recordatorios[0].contenido).toBe(
        'Tu Turno Mañana empieza a las 08:00. Recuerda escanear el QR al llegar.',
      );
      // empleado2 apagó «Recordatorios de fichaje».
      expect(await deTipo('empleado2', 'RECORDATORIO_ENTRADA')).toHaveLength(0);

      // Fuera de la ventana no hay recordatorio.
      t.reloj.fijar('2026-10-14T12:30:00Z'); // miércoles 07:30
      await ejecutar();
      expect(await deTipo('empleado', 'RECORDATORIO_ENTRADA')).toHaveLength(1);
    });
  });

  describe('miembro nuevo', () => {
    it('avisa a ADMIN y SUPERVISOR, no a los empleados', async () => {
      const { body } = await t.http
        .post(`/organizaciones/${e.orgId}/codigos-invitacion`)
        .set(como(e.clerk.admin))
        .send({ rol: 'EMPLEADO', vigenciaMinutos: 5 })
        .expect(201);
      await t.http
        .post(`/invitaciones/${body.codigo}/aceptar`)
        .set(como(e.clerk.nuevo))
        .expect(200);

      const [aviso] = await deTipo('supervisor', 'MIEMBRO_NUEVO');
      expect(aviso.contenido).toBe(
        'Nuevo E2E se unió a la organización como empleado.',
      );
      expect(await deTipo('admin', 'MIEMBRO_NUEVO')).toHaveLength(1);
      expect(await deTipo('empleado', 'MIEMBRO_NUEVO')).toHaveLength(0);
    });
  });

  describe('push tokens', () => {
    const registrar = (quien: string, cuerpo: object) =>
      t.http.post('/push-tokens').set(como(e.clerk[quien])).send(cuerpo);
    const expo = {
      plataforma: 'ANDROID',
      expoPushToken: 'ExponentPushToken[e2e-notif]',
    };
    const web = {
      plataforma: 'WEB',
      webPushSubscription: {
        endpoint: 'https://push.example.test/e2e-notif',
        keys: { p256dh: 'BNcRd', auth: 'tBHI' },
      },
    };

    afterAll(async () => {
      await t.prisma.pushToken.deleteMany({
        where: { usuarioId: { in: Object.values(usuario) } },
      });
    });

    it('registra, mueve el token a la cuenta que inicia sesión y lo desactiva', async () => {
      await registrar('empleado', { plataforma: 'IOS' }).expect(400);
      const primero = await registrar('empleado', expo).expect(201);
      expect(primero.body).toMatchObject({
        usuarioId: usuario.empleado,
        plataforma: 'ANDROID',
        activo: true,
      });

      // Otra cuenta en el mismo dispositivo: el token pasa a ella.
      const movido = await registrar('empleado2', expo).expect(201);
      expect(movido.body).toMatchObject({
        id: primero.body.id,
        usuarioId: usuario.empleado2,
      });

      await t.http
        .delete('/push-tokens')
        .set(como(e.clerk.empleado2))
        .send({ expoPushToken: expo.expoPushToken })
        .expect(204);
      const fila = await t.prisma.pushToken.findUniqueOrThrow({
        where: { id: primero.body.id },
      });
      expect(fila.activo).toBe(false);
      await t.http
        .delete('/push-tokens')
        .set(como(e.clerk.empleado2))
        .send({})
        .expect(400);
    });

    it('registra la suscripción web por su endpoint y no devuelve sus claves', async () => {
      const creada = await registrar('empleado', web).expect(201);
      expect(creada.body.webPushSubscription).toEqual({
        endpoint: web.webPushSubscription.endpoint,
      });
      const repetida = await registrar('empleado', web).expect(201);
      expect(repetida.body.id).toBe(creada.body.id);
    });

    it('entrega la clave pública VAPID solo si está configurada', async () => {
      const previas = {
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
        VAPID_SUBJECT: process.env.VAPID_SUBJECT,
      };
      delete process.env.VAPID_PUBLIC_KEY;
      await t.http
        .get('/push-tokens/clave-web')
        .set(como(e.clerk.empleado))
        .expect(503);

      const claves = webpush.generateVAPIDKeys();
      process.env.VAPID_PUBLIC_KEY = claves.publicKey;
      process.env.VAPID_PRIVATE_KEY = claves.privateKey;
      process.env.VAPID_SUBJECT = 'mailto:e2e@example.test';
      const respuesta = await t.http
        .get('/push-tokens/clave-web')
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(respuesta.body).toEqual({ clavePublica: claves.publicKey });

      Object.assign(process.env, previas);
      for (const [clave, valor] of Object.entries(previas)) {
        if (valor === undefined) delete process.env[clave];
      }
    });
  });
});
