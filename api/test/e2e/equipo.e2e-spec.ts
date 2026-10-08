import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { ClerkAuthGuard } from '../../src/common/guards/clerk-auth.guard';
import { PrismaService } from '../../src/prisma/prisma.service';

// Contra la base de desarrollo: todo lo creado usa el prefijo `e2e_` y se elimina al terminar.
const SUFIJO = Date.now().toString(36);
const clerk = (nombre: string) => `e2e_${nombre}_${SUFIJO}`;
const ADMIN = clerk('admin');
const SUPERVISOR = clerk('supervisor');
const EMPLEADO = clerk('empleado');
const AJENO = clerk('ajeno');
const OTRO = clerk('otro');

describe('Equipo, reenvío y códigos genéricos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;
  let organizacionId: string;

  const como = (clerkId: string) => ({ 'x-test-clerk-id': clerkId });
  const email = (clerkId: string) => `${clerkId}@example.test`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ClerkAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          const clerkId = req.headers['x-test-clerk-id'];
          if (!clerkId) throw new UnauthorizedException();
          req.user = { clerkId };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());

    const nombres: [string, string][] = [
      [ADMIN, 'Mateo Vargas'],
      [SUPERVISOR, 'Sofía Morales'],
      [EMPLEADO, 'Carlos Méndez'],
      [AJENO, 'Ajeno E2E'],
      [OTRO, 'Otro E2E'],
    ];
    for (const [clerkId, nombre] of nombres) {
      await prisma.usuario.create({
        data: { clerkId, nombre, email: email(clerkId) },
      });
    }

    const res = await http
      .post('/organizaciones')
      .set(como(ADMIN))
      .send({ nombre: `E2E Equipo ${SUFIJO}` })
      .expect(201);
    organizacionId = res.body.id;

    // Los otros dos miembros entran directamente por la base de datos.
    const usuarios = await prisma.usuario.findMany({
      where: { clerkId: { in: [SUPERVISOR, EMPLEADO] } },
    });
    for (const u of usuarios) {
      await prisma.miembroOrganizacion.create({
        data: {
          usuarioId: u.id,
          organizacionId,
          rol: u.clerkId === SUPERVISOR ? 'SUPERVISOR' : 'EMPLEADO',
          estado: 'ACTIVO',
          fechaIngreso: new Date(),
        },
      });
    }
  });

  afterAll(async () => {
    const usuarios = await prisma.usuario.findMany({
      where: { clerkId: { in: [ADMIN, SUPERVISOR, EMPLEADO, AJENO, OTRO] } },
      select: { id: true },
    });
    const ids = usuarios.map((u) => u.id);
    // Las organizaciones arrastran en cascada miembros, invitaciones y códigos.
    await prisma.organizacion.deleteMany({
      where: { miembros: { some: { usuarioId: { in: ids } } } },
    });
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  const invitar = (clerkId: string, body: object) =>
    http
      .post(`/organizaciones/${organizacionId}/invitaciones`)
      .set(como(clerkId))
      .send(body);
  const listar = (clerkId: string, query = '') =>
    http
      .get(`/organizaciones/${organizacionId}/equipo${query}`)
      .set(como(clerkId));

  describe('GET /organizaciones/{id}/equipo', () => {
    let invitacionId: string;

    beforeAll(async () => {
      const res = await invitar(ADMIN, {
        email: 'Lucia.Dominguez@Example.test',
        rol: 'EMPLEADO',
      }).expect(201);
      invitacionId = res.body.id;
    });

    it('lista primero a los miembros por rol y nombre, y al final las invitaciones pendientes', async () => {
      const res = await listar(EMPLEADO).expect(200);

      expect(res.body.items.map((i: any) => `${i.tipo}:${i.rol}`)).toEqual([
        'MIEMBRO:ADMIN',
        'MIEMBRO:SUPERVISOR',
        'MIEMBRO:EMPLEADO',
        'INVITACION:EMPLEADO',
      ]);
      expect(res.body.items[0]).toMatchObject({
        nombre: 'Mateo Vargas',
        email: email(ADMIN),
        avatarUrl: null,
      });
      expect(res.body.items[3]).toMatchObject({
        email: 'lucia.dominguez@example.test',
      });
      expect(res.body.items[3]).not.toHaveProperty('nombre'); // sin cuenta: solo el correo
      expect(res.body).toMatchObject({
        total: 4,
        page: 1,
        pageSize: 20,
        conteos: {
          todos: 4,
          admins: 1,
          supervisores: 1,
          empleados: 1,
          pendientes: 1,
        },
      });
    });

    it('filtra por rol y por pendientes; los conteos no dependen del filtro', async () => {
      for (const [filtro, total] of [
        ['ADMIN', 1],
        ['SUPERVISOR', 1],
        ['EMPLEADO', 1],
        ['PENDIENTES', 1],
      ] as const) {
        const res = await listar(ADMIN, `?filtro=${filtro}`).expect(200);
        expect(res.body.total).toBe(total);
        expect(res.body.conteos.todos).toBe(4);
      }
    });

    it('busca por nombre o correo sin distinguir mayúsculas ni acentos', async () => {
      expect(
        (await listar(ADMIN, '?q=SOFIA').expect(200)).body.items[0].nombre,
      ).toBe('Sofía Morales');
      expect((await listar(ADMIN, '?q=mendez').expect(200)).body.total).toBe(1);
      expect(
        (await listar(ADMIN, '?q=lucia.dom').expect(200)).body.items[0].tipo,
      ).toBe('INVITACION');
      expect((await listar(ADMIN, '?q=zzz').expect(200)).body.total).toBe(0);
    });

    it('pagina los resultados', async () => {
      const p2 = await listar(ADMIN, '?page=2&pageSize=3').expect(200);
      expect(p2.body).toMatchObject({ total: 4, page: 2, pageSize: 3 });
      expect(p2.body.items).toHaveLength(1);
      expect(p2.body.items[0].tipo).toBe('INVITACION');
    });

    it('valida los parámetros con el DTO (400)', async () => {
      await listar(ADMIN, '?page=0').expect(400);
      await listar(ADMIN, '?pageSize=101').expect(400);
      await listar(ADMIN, '?page=abc').expect(400);
      await listar(ADMIN, '?filtro=NOPE').expect(400);
      await listar(ADMIN, '?desconocido=1').expect(400);
      await http
        .get('/organizaciones/no-es-uuid/equipo')
        .set(como(ADMIN))
        .expect(400);
    });

    it('un usuario que no es miembro no ve la organización (404)', async () => {
      await listar(AJENO).expect(404);
    });

    it('rechaza una invitación pendiente duplicada (409)', async () => {
      await invitar(ADMIN, {
        email: 'lucia.dominguez@example.test',
        rol: 'SUPERVISOR',
      }).expect(409);
    });

    describe('POST /invitaciones/{id}/reenviar', () => {
      it('renueva la vigencia (200)', async () => {
        await prisma.invitacion.update({
          where: { id: invitacionId },
          data: { expiraEn: new Date(Date.now() + 60_000) },
        });
        const res = await http
          .post(`/invitaciones/${invitacionId}/reenviar`)
          .set(como(ADMIN))
          .expect(200);

        expect(res.body).toMatchObject({
          tipo: 'INVITACION',
          id: invitacionId,
          rol: 'EMPLEADO',
        });
        const dias =
          (new Date(res.body.expiraEn).getTime() - Date.now()) / 86_400_000;
        expect(dias).toBeGreaterThan(6.9);
        expect(dias).toBeLessThanOrEqual(7);
      });

      it('valida permisos e identificador', async () => {
        await http
          .post(`/invitaciones/${invitacionId}/reenviar`)
          .set(como(EMPLEADO))
          .expect(403);
        await http
          .post(`/invitaciones/${invitacionId}/reenviar`)
          .set(como(AJENO))
          .expect(404);
        await http
          .post('/invitaciones/no-es-uuid/reenviar')
          .set(como(ADMIN))
          .expect(400);
        await http
          .post('/invitaciones/00000000-0000-4000-8000-000000000000/reenviar')
          .set(como(ADMIN))
          .expect(404);
      });

      it('una invitación ya aceptada no se puede reenviar (410)', async () => {
        const creada = await invitar(ADMIN, {
          email: email(AJENO),
          rol: 'EMPLEADO',
        }).expect(201);
        await http
          .post(`/invitaciones/${creada.body.token}/aceptar`)
          .set(como(AJENO))
          .expect(200);
        await http
          .post(`/invitaciones/${creada.body.id}/reenviar`)
          .set(como(ADMIN))
          .expect(410);
      });
    });
  });

  describe('POST /organizaciones/{id}/codigos-invitacion (código genérico)', () => {
    const generar = (clerkId: string, body: object) =>
      http
        .post(`/organizaciones/${organizacionId}/codigos-invitacion`)
        .set(como(clerkId))
        .send(body);

    it('genera un código con el rol y la vigencia indicados', async () => {
      for (const vigenciaMinutos of [5, 10, 15]) {
        const res = await generar(ADMIN, {
          rol: 'SUPERVISOR',
          vigenciaMinutos,
        }).expect(201);
        expect(res.body.codigo).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
        expect(res.body.rol).toBe('SUPERVISOR');
        const minutos =
          (new Date(res.body.expiraEn).getTime() - Date.now()) / 60_000;
        expect(minutos).toBeGreaterThan(vigenciaMinutos - 0.5);
        expect(minutos).toBeLessThanOrEqual(vigenciaMinutos);
      }
    });

    it('valida los datos con el DTO y los permisos', async () => {
      await generar(ADMIN, { rol: 'SUPERVISOR', vigenciaMinutos: 30 }).expect(
        400,
      );
      await generar(ADMIN, { rol: 'SUPER_ADMIN', vigenciaMinutos: 5 }).expect(
        400,
      );
      await generar(ADMIN, { rol: 'EMPLEADO' }).expect(400);
      await generar(ADMIN, {
        rol: 'EMPLEADO',
        vigenciaMinutos: 5,
        extra: true,
      }).expect(400);
      await generar(EMPLEADO, { rol: 'EMPLEADO', vigenciaMinutos: 5 }).expect(
        403,
      );
      await generar(OTRO, { rol: 'EMPLEADO', vigenciaMinutos: 5 }).expect(404);
    });

    it('cualquier persona puede canjearlo (varias veces) y entra con el rol del código', async () => {
      const { body } = await generar(ADMIN, {
        rol: 'SUPERVISOR',
        vigenciaMinutos: 10,
      }).expect(201);

      // En minúsculas y con espacios: se normaliza.
      const aceptado = await http
        .post(`/invitaciones/%20${body.codigo.toLowerCase()}%20/aceptar`)
        .set(como(OTRO))
        .expect(200);
      expect(aceptado.body).toMatchObject({
        rol: 'SUPERVISOR',
        estado: 'ACTIVO',
      });
      expect(aceptado.body.usuario.clerkId).toBe(OTRO);

      // Quien ya es miembro no puede volver a canjearlo.
      await http
        .post(`/invitaciones/${body.codigo}/aceptar`)
        .set(como(OTRO))
        .expect(409);

      const membresias = await http
        .get('/me/membresias')
        .set(como(OTRO))
        .expect(200);
      expect(membresias.body[0]).toMatchObject({
        rol: 'SUPERVISOR',
        organizacion: { id: organizacionId },
      });
    });

    it('un código vencido responde 410 y uno desconocido 404', async () => {
      const { body } = await generar(ADMIN, {
        rol: 'EMPLEADO',
        vigenciaMinutos: 5,
      }).expect(201);
      await prisma.codigoInvitacion.update({
        where: { codigo: body.codigo },
        data: { expiraEn: new Date(Date.now() - 1000) },
      });

      const nuevo = await prisma.usuario.create({
        data: {
          clerkId: clerk('nuevo'),
          nombre: 'Nuevo E2E',
          email: email(clerk('nuevo')),
        },
      });
      try {
        await http
          .post(`/invitaciones/${body.codigo}/aceptar`)
          .set(como(clerk('nuevo')))
          .expect(410);
        await http
          .post('/invitaciones/ZZZZZZZZZZ/aceptar')
          .set(como(clerk('nuevo')))
          .expect(404);
      } finally {
        await prisma.usuario.delete({ where: { id: nuevo.id } });
      }
    });
  });
});
