import {
  AppDePrueba,
  como,
  crearAppDePrueba,
  crearEscenario,
  Escenario,
  limpiarEscenario,
} from './support/app-de-prueba';

// Lunes 12 de octubre de 2026, 10:00 en Lima (UTC-5).
const AHORA = '2026-10-12T15:00:00Z';
const PDF = Buffer.from('%PDF-1.7\n% documento de prueba\n');
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);

describe('Tareas: calendario, detalle, edición, comentarios, actividad y adjuntos (e2e)', () => {
  let t: AppDePrueba;
  let e: Escenario;
  let otra: Escenario;
  let tareaId: string;

  const nueva = (extra: object = {}) => ({
    titulo: 'Inspección de accesos',
    descripcion: 'Revisar **torniquetes**',
    prioridad: 'ALTA',
    fechaInicio: '2026-10-12T14:00:00.000Z',
    fechaFin: '2026-10-12T16:00:00.000Z',
    ubicacion: 'Torno Norte',
    etiquetas: ['Seguridad'],
    miembroIds: [e.miembro.empleado],
    subtareas: [
      { titulo: 'Paso 1', completada: false },
      { titulo: 'Paso 2', completada: false },
    ],
    ...extra,
  });
  const crear = (quien: string, cuerpo: object, org = e.orgId) =>
    t.http.post(`/organizaciones/${org}/tareas`).set(como(quien)).send(cuerpo);
  const detalle = (quien: string, id = tareaId) =>
    t.http.get(`/tareas/${id}`).set(como(quien));
  const actividad = async (quien = e.clerk.admin) =>
    (
      await t.http
        .get(`/tareas/${tareaId}/actividad`)
        .set(como(quien))
        .expect(200)
    ).body as {
      tipo: string;
      descripcion: string;
      actor: { nombre: string };
    }[];

  beforeAll(async () => {
    t = await crearAppDePrueba();
    e = await crearEscenario(t, 'tareas', {
      supervisor: 'SUPERVISOR',
      empleado: 'EMPLEADO',
      ajeno: null,
    });
    otra = await crearEscenario(t, 'tareas_otra', {});
    t.reloj.fijar(AHORA);
  });

  afterAll(async () => {
    await limpiarEscenario(t, e);
    await limpiarEscenario(t, otra);
    await t.app.close();
  });

  describe('crear', () => {
    it('ADMIN y SUPERVISOR crean tareas; EMPLEADO no', async () => {
      const res = await crear(e.clerk.admin, nueva()).expect(201);
      tareaId = res.body.id;
      expect(res.body).toMatchObject({
        titulo: 'Inspección de accesos',
        estado: 'PENDIENTE',
        prioridad: 'ALTA',
        ubicacion: 'Torno Norte',
        etiquetas: ['Seguridad'],
        asignadaAMi: false,
        subtareas: { completadas: 0, total: 2 },
        comentarios: 0,
        adjuntos: [],
      });
      expect(res.body.asignados).toEqual([
        expect.objectContaining({ miembroId: e.miembro.empleado }),
      ]);
      expect(
        res.body.listaSubtareas.map((s: { titulo: string }) => s.titulo),
      ).toEqual(['Paso 1', 'Paso 2']);

      await crear(
        e.clerk.supervisor,
        nueva({
          titulo: 'Tarea del supervisor',
          miembroIds: [e.miembro.supervisor],
        }),
      ).expect(201);
      const prohibido = await crear(e.clerk.empleado, nueva()).expect(403);
      expect(prohibido.body.message).toMatch(/ADMIN o SUPERVISOR/);
    });

    it('valida título, fechas del mismo día y que las personas sean del equipo activo', async () => {
      await crear(e.clerk.admin, nueva({ titulo: 'ab' })).expect(400);
      await crear(
        e.clerk.admin,
        nueva({ fechaFin: '2026-10-12T13:00:00.000Z' }),
      ).expect(400);
      const otroDia = await crear(
        e.clerk.admin,
        nueva({ fechaFin: '2026-10-13T06:00:00.000Z' }),
      ).expect(400);
      expect(otroDia.body.message).toMatch(/mismo día/);
      await crear(
        e.clerk.admin,
        nueva({ miembroIds: [otra.miembro.admin] }),
      ).expect(400);
      await crear(e.clerk.admin, nueva({ miembroIds: [] })).expect(400);
      await crear(e.clerk.ajeno, nueva()).expect(404);
    });
  });

  describe('leer', () => {
    it('cualquier miembro ve todas las tareas del rango; se puede filtrar por miembro', async () => {
      const url = `/organizaciones/${e.orgId}/tareas?desde=2026-10-12&hasta=2026-10-12`;
      const todas = await t.http
        .get(url)
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(todas.body).toHaveLength(2);
      expect(
        todas.body.find((x: { id: string }) => x.id === tareaId).asignadaAMi,
      ).toBe(true);

      const delSupervisor = await t.http
        .get(`${url}&miembroId=${e.miembro.supervisor}`)
        .set(como(e.clerk.admin))
        .expect(200);
      expect(
        delSupervisor.body.map((x: { titulo: string }) => x.titulo),
      ).toEqual(['Tarea del supervisor']);

      const otroDia = await t.http
        .get(
          `/organizaciones/${e.orgId}/tareas?desde=2026-10-13&hasta=2026-10-14`,
        )
        .set(como(e.clerk.admin))
        .expect(200);
      expect(otroDia.body).toHaveLength(0);

      await t.http.get(url).set(como(e.clerk.ajeno)).expect(404);
      await t.http
        .get(
          `/organizaciones/${e.orgId}/tareas?desde=2026-01-01&hasta=2026-12-31`,
        )
        .set(como(e.clerk.admin))
        .expect(400);
    });

    it('`/me/tareas` devuelve solo las asignadas', async () => {
      const res = await t.http
        .get(
          `/me/tareas?organizacionId=${e.orgId}&desde=2026-10-12&hasta=2026-10-12`,
        )
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(res.body.map((x: { id: string }) => x.id)).toEqual([tareaId]);
    });

    it('el detalle de otra organización no existe para quien no es miembro', async () => {
      await detalle(e.clerk.empleado).expect(200);
      await detalle(otra.clerk.admin).expect(404);
      await detalle(
        e.clerk.admin,
        '00000000-0000-4000-8000-000000000000',
      ).expect(404);
      await detalle(e.clerk.admin, 'no-es-uuid').expect(400);
    });
  });

  describe('acciones de cualquier miembro', () => {
    it('EMPLEADO mueve el estado, marca subtareas y comenta; todo queda en la actividad', async () => {
      const estado = await t.http
        .patch(`/tareas/${tareaId}/estado`)
        .set(como(e.clerk.empleado))
        .send({ estado: 'EN_PROGRESO' })
        .expect(200);
      expect(estado.body.estado).toBe('EN_PROGRESO');

      const subtareaId = estado.body.listaSubtareas[0].id;
      await t.http
        .patch(`/tareas/${tareaId}/subtareas/${subtareaId}`)
        .set(como(e.clerk.empleado))
        .send({ completada: true })
        .expect(200);
      await t.http
        .patch(
          `/tareas/${tareaId}/subtareas/00000000-0000-4000-8000-000000000000`,
        )
        .set(como(e.clerk.empleado))
        .send({ completada: true })
        .expect(404);

      await t.http
        .post(`/tareas/${tareaId}/comentarios`)
        .set(como(e.clerk.empleado))
        .send({ texto: '  Empiezo ya  ' })
        .expect(201);
      await t.http
        .post(`/tareas/${tareaId}/comentarios`)
        .set(como(e.clerk.empleado))
        .send({ texto: '   ' })
        .expect(400);
      const comentarios = await t.http
        .get(`/tareas/${tareaId}/comentarios`)
        .set(como(e.clerk.admin))
        .expect(200);
      expect(comentarios.body).toEqual([
        expect.objectContaining({
          texto: 'Empiezo ya',
          autor: expect.objectContaining({ miembroId: e.miembro.empleado }),
        }),
      ]);

      const eventos = await actividad();
      expect(eventos.map((a) => a.descripcion)).toEqual([
        'comentó la tarea',
        'completó «Paso 1»',
        'movió la tarea a En progreso',
        'creó la tarea',
      ]);
      expect(eventos[0].actor.nombre).toBe('Empleado E2E');
    });

    it('completar la tarea guarda cuándo se completó', async () => {
      await t.http
        .patch(`/tareas/${tareaId}/estado`)
        .set(como(e.clerk.empleado))
        .send({ estado: 'COMPLETADA' })
        .expect(200);
      expect(
        (
          await t.prisma.tarea.findUniqueOrThrow({ where: { id: tareaId } })
        ).completadaEn?.toISOString(),
      ).toBe(new Date(AHORA).toISOString());
      await t.http
        .patch(`/tareas/${tareaId}/estado`)
        .set(como(e.clerk.empleado))
        .send({ estado: 'REVISION' })
        .expect(200);
      expect(
        (await t.prisma.tarea.findUniqueOrThrow({ where: { id: tareaId } }))
          .completadaEn,
      ).toBeNull();
    });
  });

  describe('editar', () => {
    it('reemplaza subtareas, personas y etiquetas y registra cada cambio', async () => {
      const actual = (await detalle(e.clerk.admin).expect(200)).body;
      const [paso1, paso2] = actual.listaSubtareas;
      const res = await t.http
        .patch(`/tareas/${tareaId}`)
        .set(como(e.clerk.admin))
        .send(
          nueva({
            estado: 'REVISION',
            prioridad: 'MEDIA',
            etiquetas: ['Calidad'],
            miembroIds: [e.miembro.empleado, e.miembro.supervisor],
            subtareas: [
              { id: paso1.id, titulo: 'Paso uno', completada: true },
              { titulo: 'Paso 3', completada: false },
            ],
          }),
        )
        .expect(200);
      expect(
        res.body.listaSubtareas.map((s: { titulo: string }) => s.titulo),
      ).toEqual(['Paso uno', 'Paso 3']);
      expect(res.body.asignados).toHaveLength(2);
      expect(
        await t.prisma.subtareaTarea.count({ where: { id: paso2.id } }),
      ).toBe(0);

      const textos = (await actividad()).map((a) => a.descripcion);
      expect(textos).toEqual(
        expect.arrayContaining([
          'cambió la prioridad a Normal',
          'añadió la etiqueta «Calidad»',
          'quitó la etiqueta «Seguridad»',
          'asignó a Supervisor E2E',
          'renombró «Paso 1» a «Paso uno»',
          'añadió la subtarea «Paso 3»',
          'eliminó la subtarea «Paso 2»',
        ]),
      );
    });

    it('EMPLEADO no edita; las subtareas deben ser de la tarea', async () => {
      await t.http
        .patch(`/tareas/${tareaId}`)
        .set(como(e.clerk.empleado))
        .send(nueva())
        .expect(403);
      await t.http
        .patch(`/tareas/${tareaId}`)
        .set(como(e.clerk.admin))
        .send(
          nueva({
            subtareas: [
              {
                id: '00000000-0000-4000-8000-000000000000',
                titulo: 'X',
                completada: false,
              },
            ],
          }),
        )
        .expect(400);
    });
  });

  describe('adjuntos', () => {
    let adjuntoId: string;
    const subir = (
      quien: string,
      buffer: Buffer,
      nombre: string,
      tipo: string,
    ) =>
      t.http
        .post(`/tareas/${tareaId}/adjuntos`)
        .set(como(quien))
        .attach('archivo', buffer, { filename: nombre, contentType: tipo });

    it('acepta PDF e imágenes por su contenido y rechaza lo demás', async () => {
      const pdf = await subir(
        e.clerk.admin,
        PDF,
        'guia.pdf',
        'application/pdf',
      ).expect(201);
      adjuntoId = pdf.body.id;
      expect(pdf.body).toMatchObject({
        tipo: 'ARCHIVO',
        mimeType: 'application/pdf',
        nombreArchivo: 'guia.pdf',
        orden: 0,
      });
      expect(pdf.body).not.toHaveProperty('cloudinaryPublicId');

      const png = await subir(
        e.clerk.supervisor,
        PNG,
        'foto.png',
        'image/png',
      ).expect(201);
      expect(png.body).toMatchObject({
        tipo: 'IMAGEN',
        mimeType: 'image/png',
        orden: 1,
      });

      // Un texto disfrazado de PDF no pasa: se mira el contenido, no la extensión.
      await subir(
        e.clerk.admin,
        Buffer.from('hola'),
        'falso.pdf',
        'application/pdf',
      ).expect(415);
      const grande = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]);
      const res413 = await subir(
        e.clerk.admin,
        grande,
        'grande.pdf',
        'application/pdf',
      ).expect(413);
      expect(res413.body.message).toMatch(/10 MB/);
      await subir(e.clerk.empleado, PDF, 'guia.pdf', 'application/pdf').expect(
        403,
      );
      await t.http
        .post(`/tareas/${tareaId}/adjuntos`)
        .set(como(e.clerk.admin))
        .expect(400);

      expect(t.cloudinary.subidos).toHaveLength(2);
      expect(
        (await detalle(e.clerk.empleado).expect(200)).body.adjuntos,
      ).toHaveLength(2);
    });

    it('cualquier miembro obtiene el archivo con su tipo y su nombre original', async () => {
      const url = `/tareas/${tareaId}/adjuntos/${adjuntoId}/archivo`;
      const visor = await t.http
        .get(url)
        .set(como(e.clerk.empleado))
        .buffer(true)
        .expect(200);
      expect(visor.headers['content-type']).toMatch(/application\/pdf/);
      expect(visor.headers['content-disposition']).toBe(
        `inline; filename="guia.pdf"; filename*=UTF-8''guia.pdf`,
      );
      expect(Buffer.from(visor.body as Buffer).equals(PDF)).toBe(true);

      const descarga = await t.http
        .get(`${url}?descargar=true`)
        .set(como(e.clerk.admin))
        .expect(200);
      expect(descarga.headers['content-disposition']).toMatch(
        /^attachment; filename="guia\.pdf"/,
      );

      await t.http
        .get(`${url}?descargar=quizas`)
        .set(como(e.clerk.admin))
        .expect(400);
      await t.http.get(url).set(como(otra.clerk.admin)).expect(404);
      await t.http
        .get(
          `/tareas/${tareaId}/adjuntos/00000000-0000-4000-8000-000000000000/archivo`,
        )
        .set(como(e.clerk.admin))
        .expect(404);
    });

    it('quitar un adjunto lo borra de Cloudinary y queda en la actividad', async () => {
      await t.http
        .delete(`/tareas/${tareaId}/adjuntos/${adjuntoId}`)
        .set(como(e.clerk.empleado))
        .expect(403);
      await t.http
        .delete(`/tareas/${tareaId}/adjuntos/${adjuntoId}`)
        .set(como(e.clerk.admin))
        .expect(204);
      await t.http
        .delete(`/tareas/${tareaId}/adjuntos/${adjuntoId}`)
        .set(como(e.clerk.admin))
        .expect(404);
      expect(t.cloudinary.eliminados).toEqual(['prueba/1']);

      const restantes = (await detalle(e.clerk.admin).expect(200)).body
        .adjuntos;
      expect(restantes).toEqual([
        expect.objectContaining({ nombreArchivo: 'foto.png', orden: 0 }),
      ]);
      expect((await actividad()).map((a) => a.descripcion)).toEqual(
        expect.arrayContaining([
          'adjuntó «guia.pdf»',
          'adjuntó «foto.png»',
          'quitó el adjunto «guia.pdf»',
        ]),
      );
    });
  });

  describe('Inicio', () => {
    it('muestra mis tareas de hoy y el avance de la semana; el panel, las de la organización', async () => {
      const mio = await t.http
        .get(`/organizaciones/${e.orgId}/inicio/mio`)
        .set(como(e.clerk.empleado))
        .expect(200);
      expect(mio.body.tareas.hoy.map((x: { id: string }) => x.id)).toEqual([
        tareaId,
      ]);
      expect(mio.body.tareas.semana).toEqual({ completadas: 0, total: 1 });

      await t.http
        .patch(`/tareas/${tareaId}/estado`)
        .set(como(e.clerk.empleado))
        .send({ estado: 'COMPLETADA' })
        .expect(200);
      const panel = await t.http
        .get(`/organizaciones/${e.orgId}/inicio/panel`)
        .set(como(e.clerk.admin))
        .expect(200);
      expect(panel.body.tareasOrganizacion).toEqual({
        completadas: 1,
        total: 2,
      });

      const admin = await t.http
        .get(`/organizaciones/${e.orgId}/inicio/mio`)
        .set(como(e.clerk.admin))
        .expect(200);
      expect(admin.body.tareas).toEqual({
        hoy: [],
        semana: { completadas: 0, total: 0 },
      });
    });
  });

  describe('duplicar y eliminar', () => {
    it('duplicar copia sin adjuntos, en Por hacer y con las subtareas sin marcar', async () => {
      await t.http
        .post(`/tareas/${tareaId}/duplicar`)
        .set(como(e.clerk.empleado))
        .expect(403);
      const copia = await t.http
        .post(`/tareas/${tareaId}/duplicar`)
        .set(como(e.clerk.admin))
        .expect(201);
      expect(copia.body).toMatchObject({
        titulo: 'Inspección de accesos (copia)',
        estado: 'PENDIENTE',
        adjuntos: [],
        comentarios: 0,
      });
      expect(
        copia.body.listaSubtareas.every(
          (s: { completada: boolean }) => !s.completada,
        ),
      ).toBe(true);
      const eventos = (
        await t.http
          .get(`/tareas/${copia.body.id}/actividad`)
          .set(como(e.clerk.admin))
          .expect(200)
      ).body;
      expect(eventos).toEqual([expect.objectContaining({ tipo: 'DUPLICADA' })]);
    });

    it('eliminar borra en cascada y quita los archivos de Cloudinary', async () => {
      await t.http
        .delete(`/tareas/${tareaId}`)
        .set(como(e.clerk.empleado))
        .expect(403);
      await t.http
        .delete(`/tareas/${tareaId}`)
        .set(como(e.clerk.admin))
        .expect(204);
      await detalle(e.clerk.admin).expect(404);
      expect(t.cloudinary.eliminados).toEqual(['prueba/1', 'prueba/2']);
      expect(await t.prisma.comentarioTarea.count({ where: { tareaId } })).toBe(
        0,
      );
      expect(await t.prisma.actividadTarea.count({ where: { tareaId } })).toBe(
        0,
      );
      expect(await t.prisma.subtareaTarea.count({ where: { tareaId } })).toBe(
        0,
      );
    });
  });
});
