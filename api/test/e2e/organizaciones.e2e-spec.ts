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
const ADMIN_CLERK = `e2e_admin_${SUFIJO}`;
const INVITADO_CLERK = `e2e_invitado_${SUFIJO}`;
const AJENO_CLERK = `e2e_ajeno_${SUFIJO}`;

describe('Organizaciones e invitaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const como = (clerkId: string) => ({ 'x-test-clerk-id': clerkId });

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

    for (const [clerkId, nombre] of [
      [ADMIN_CLERK, 'Admin E2E'],
      [INVITADO_CLERK, 'Invitado E2E'],
      [AJENO_CLERK, 'Ajeno E2E'],
    ]) {
      await prisma.usuario.create({
        data: { clerkId, nombre, email: `${clerkId}@example.test` },
      });
    }
  });

  afterAll(async () => {
    const usuarios = await prisma.usuario.findMany({
      where: { clerkId: { in: [ADMIN_CLERK, INVITADO_CLERK, AJENO_CLERK] } },
      select: { id: true },
    });
    const ids = usuarios.map((u) => u.id);
    // Las organizaciones se llevan en cascada sus miembros e invitaciones.
    await prisma.organizacion.deleteMany({
      where: { miembros: { some: { usuarioId: { in: ids } } } },
    });
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  it('rechaza sin identidad (401)', async () => {
    await http.get('/me/membresias').expect(401);
  });

  it('GET /auth/me devuelve el usuario local', async () => {
    const res = await http.get('/auth/me').set(como(ADMIN_CLERK)).expect(200);
    expect(res.body).toMatchObject({
      clerkId: ADMIN_CLERK,
      email: `${ADMIN_CLERK}@example.test`,
    });
  });

  describe('crear organización', () => {
    it('valida el nombre y la zona horaria (400)', async () => {
      await http
        .post('/organizaciones')
        .set(como(ADMIN_CLERK))
        .send({ nombre: ' ' })
        .expect(400);
      await http
        .post('/organizaciones')
        .set(como(ADMIN_CLERK))
        .send({ nombre: 'Org válida', zonaHoraria: 'Marte/Olimpo' })
        .expect(400);
    });

    it('crea la organización, deja al creador como ADMIN y evita slugs duplicados', async () => {
      const nombre = `E2E Café Ñandú ${SUFIJO}`;
      const a = await http
        .post('/organizaciones')
        .set(como(ADMIN_CLERK))
        .send({ nombre })
        .expect(201);
      expect(a.body.slug).toBe(`e2e-cafe-nandu-${SUFIJO}`);
      expect(a.body.zonaHoraria).toBe('America/Lima');

      const b = await http
        .post('/organizaciones')
        .set(como(ADMIN_CLERK))
        .send({ nombre, zonaHoraria: 'America/Bogota' })
        .expect(201);
      expect(b.body.slug).not.toBe(a.body.slug);
      expect(b.body.slug.startsWith(a.body.slug)).toBe(true);

      const membresias = await http
        .get('/me/membresias')
        .set(como(ADMIN_CLERK))
        .expect(200);
      expect(membresias.body).toHaveLength(2);
      expect(membresias.body[0]).toMatchObject({
        rol: 'ADMIN',
        estado: 'ACTIVO',
        organizacion: { id: a.body.id, nombre, miembrosActivos: 1 },
      });
      expect(membresias.body[0].organizacion).not.toHaveProperty('activa');
    });

    it('un usuario sin membresías recibe una lista vacía', async () => {
      const res = await http
        .get('/me/membresias')
        .set(como(AJENO_CLERK))
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('invitaciones', () => {
    let organizacionId: string;

    beforeAll(async () => {
      const res = await http
        .post('/organizaciones')
        .set(como(ADMIN_CLERK))
        .send({ nombre: `E2E Invitaciones ${SUFIJO}` })
        .expect(201);
      organizacionId = res.body.id;
    });

    const invitar = (clerkId: string, body: object) =>
      http
        .post(`/organizaciones/${organizacionId}/invitaciones`)
        .set(como(clerkId))
        .send(body);

    it('valida los datos y los permisos al invitar', async () => {
      await invitar(ADMIN_CLERK, {
        email: 'no-es-correo',
        rol: 'EMPLEADO',
      }).expect(400);
      await invitar(ADMIN_CLERK, {
        email: 'a@b.co',
        rol: 'SUPER_ADMIN',
      }).expect(400);
      await invitar(AJENO_CLERK, { email: 'a@b.co', rol: 'EMPLEADO' }).expect(
        404,
      );
      await invitar(ADMIN_CLERK, {
        email: 'a@b.co',
        rol: 'EMPLEADO',
        extra: 'no permitido',
      }).expect(400);
      await http
        .post('/organizaciones/no-es-uuid/invitaciones')
        .set(como(ADMIN_CLERK))
        .send({ email: 'a@b.co', rol: 'EMPLEADO' })
        .expect(400);
    });

    it('el código solo lo acepta el correo invitado, una sola vez', async () => {
      const creada = await invitar(ADMIN_CLERK, {
        email: `${INVITADO_CLERK}@example.test`.toUpperCase(),
        rol: 'SUPERVISOR',
      }).expect(201);
      const token: string = creada.body.token;
      expect(token).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
      expect(creada.body).not.toHaveProperty('invitadoPor');

      await http
        .post(`/invitaciones/${token}/aceptar`)
        .set(como(AJENO_CLERK))
        .expect(403);
      await http
        .post('/invitaciones/CODIGOFALSO/aceptar')
        .set(como(INVITADO_CLERK))
        .expect(404);

      // Acepta con el código en minúsculas y con espacios: se normaliza.
      const aceptada = await http
        .post(`/invitaciones/%20${token.toLowerCase()}%20/aceptar`)
        .set(como(INVITADO_CLERK))
        .expect(200);
      expect(aceptada.body).toMatchObject({
        rol: 'SUPERVISOR',
        estado: 'ACTIVO',
      });
      expect(aceptada.body.usuario.clerkId).toBe(INVITADO_CLERK);

      await http
        .post(`/invitaciones/${token}/aceptar`)
        .set(como(INVITADO_CLERK))
        .expect(410);

      const membresias = await http
        .get('/me/membresias')
        .set(como(INVITADO_CLERK))
        .expect(200);
      expect(membresias.body).toHaveLength(1);
      expect(membresias.body[0]).toMatchObject({
        rol: 'SUPERVISOR',
        organizacion: { id: organizacionId, miembrosActivos: 2 },
      });

      await invitar(ADMIN_CLERK, {
        email: `${INVITADO_CLERK}@example.test`,
        rol: 'EMPLEADO',
      }).expect(409);
    });

    it('una invitación vencida responde 410 y queda EXPIRADA', async () => {
      const creada = await invitar(ADMIN_CLERK, {
        email: `${AJENO_CLERK}@example.test`,
        rol: 'EMPLEADO',
      }).expect(201);
      await prisma.invitacion.update({
        where: { id: creada.body.id },
        data: { expiraEn: new Date(Date.now() - 1000) },
      });

      await http
        .post(`/invitaciones/${creada.body.token}/aceptar`)
        .set(como(AJENO_CLERK))
        .expect(410);
      const guardada = await prisma.invitacion.findUnique({
        where: { id: creada.body.id },
      });
      expect(guardada?.estado).toBe('EXPIRADA');
    });
  });
});
