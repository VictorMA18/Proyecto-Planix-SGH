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
const SUPER = clerk('super');

describe('Gestión de miembros (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;
  let orgId: string;
  const miembroId: Record<string, string> = {};

  const como = (clerkId: string) => ({ 'x-test-clerk-id': clerkId });
  const email = (clerkId: string) => `${clerkId}@example.test`;
  const url = (id: string, org = orgId) =>
    `/organizaciones/${org}/miembros/${id}`;

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
      [ADMIN, 'Mateo Vargas'],
      [SUPERVISOR, 'Sofía Morales'],
      [EMPLEADO, 'Carlos Méndez'],
      [AJENO, 'Ajeno E2E'],
      [SUPER, 'Super E2E'],
    ]) {
      await prisma.usuario.create({
        data: {
          clerkId,
          nombre,
          nombres: nombre.split(' ')[0],
          apellidos: nombre.split(' ')[1],
          email: email(clerkId),
          emailVerificado: true,
        },
      });
    }

    orgId = (
      await http
        .post('/organizaciones')
        .set(como(ADMIN))
        .send({ nombre: `E2E Miembros ${SUFIJO}` })
        .expect(201)
    ).body.id;

    for (const [clerkId, rol] of [
      [SUPERVISOR, 'SUPERVISOR'],
      [EMPLEADO, 'EMPLEADO'],
      [SUPER, 'SUPER_ADMIN'],
    ] as const) {
      const u = await prisma.usuario.findUniqueOrThrow({ where: { clerkId } });
      await prisma.miembroOrganizacion.create({
        data: {
          usuarioId: u.id,
          organizacionId: orgId,
          rol,
          estado: 'ACTIVO',
          fechaIngreso: new Date('2021-11-15'),
        },
      });
    }

    // Los ids de membresía salen del propio listado del equipo.
    const equipo = await http
      .get(`/organizaciones/${orgId}/equipo?pageSize=100`)
      .set(como(ADMIN))
      .expect(200);
    for (const item of equipo.body.items) miembroId[item.email] = item.id;
  });

  afterAll(async () => {
    const usuarios = await prisma.usuario.findMany({
      where: { clerkId: { in: [ADMIN, SUPERVISOR, EMPLEADO, AJENO, SUPER] } },
      select: { id: true },
    });
    const ids = usuarios.map((u) => u.id);
    await prisma.organizacion.deleteMany({
      where: { miembros: { some: { usuarioId: { in: ids } } } },
    });
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  const idDe = (clerkId: string) => miembroId[email(clerkId)];

  describe('GET /organizaciones/{id}/miembros/{miembroId}', () => {
    it('cualquier miembro ve el perfil de otro miembro activo', async () => {
      const res = await http
        .get(url(idDe(SUPERVISOR)))
        .set(como(EMPLEADO))
        .expect(200);

      expect(res.body).toMatchObject({
        id: idDe(SUPERVISOR),
        rol: 'SUPERVISOR',
        estado: 'ACTIVO',
        usuario: {
          nombre: 'Sofía Morales',
          email: email(SUPERVISOR),
          emailVerificado: true,
          avatarUrl: null,
        },
      });
      expect(new Date(res.body.fechaIngreso).toISOString()).toBe(
        '2021-11-15T00:00:00.000Z',
      );
      expect(res.body).not.toHaveProperty('usuarioId');
    });

    it('valida el identificador y el acceso', async () => {
      await http.get(url('no-es-uuid')).set(como(ADMIN)).expect(400);
      await http
        .get(url('00000000-0000-4000-8000-000000000000'))
        .set(como(ADMIN))
        .expect(404);
      await http
        .get(url(idDe(SUPERVISOR)))
        .set(como(AJENO))
        .expect(404);
    });

    it('no muestra miembros de otra organización (multi-tenancy)', async () => {
      const otraOrg = (
        await http
          .post('/organizaciones')
          .set(como(AJENO))
          .send({ nombre: `E2E Otra ${SUFIJO}` })
          .expect(201)
      ).body.id;
      const propio = (
        await http
          .get(`/organizaciones/${otraOrg}/equipo`)
          .set(como(AJENO))
          .expect(200)
      ).body.items[0].id;

      await http.get(url(propio, orgId)).set(como(ADMIN)).expect(404);
      await http
        .get(url(idDe(SUPERVISOR), otraOrg))
        .set(como(AJENO))
        .expect(404);
    });
  });

  describe('PATCH /organizaciones/{id}/miembros/{miembroId} (cambiar rol)', () => {
    const cambiar = (quien: string, objetivo: string, body: object) =>
      http.patch(url(objetivo)).set(como(quien)).send(body);

    it('un ADMIN cambia el rol y el cambio es inmediato', async () => {
      const res = await cambiar(ADMIN, idDe(EMPLEADO), {
        rol: 'SUPERVISOR',
      }).expect(200);
      expect(res.body).toMatchObject({
        id: idDe(EMPLEADO),
        rol: 'SUPERVISOR',
        usuario: { clerkId: EMPLEADO },
      });

      const membresias = await http
        .get('/me/membresias')
        .set(como(EMPLEADO))
        .expect(200);
      expect(membresias.body[0].rol).toBe('SUPERVISOR');

      // Vuelve a EMPLEADO para el resto de las pruebas.
      await cambiar(ADMIN, idDe(EMPLEADO), { rol: 'EMPLEADO' }).expect(200);
    });

    it('rechaza datos inválidos con el DTO (400)', async () => {
      await cambiar(ADMIN, idDe(EMPLEADO), { rol: 'SUPER_ADMIN' }).expect(400);
      await cambiar(ADMIN, idDe(EMPLEADO), { rol: 'inventado' }).expect(400);
      await cambiar(ADMIN, idDe(EMPLEADO), {}).expect(400);
      await cambiar(ADMIN, idDe(EMPLEADO), { rol: 'ADMIN', extra: 1 }).expect(
        400,
      );
      await cambiar(ADMIN, 'no-es-uuid', { rol: 'ADMIN' }).expect(400);
    });

    it('aplica las reglas de permisos', async () => {
      await cambiar(EMPLEADO, idDe(SUPERVISOR), { rol: 'EMPLEADO' }).expect(
        403,
      ); // no es admin
      await cambiar(SUPERVISOR, idDe(EMPLEADO), { rol: 'ADMIN' }).expect(403);
      await cambiar(AJENO, idDe(EMPLEADO), { rol: 'ADMIN' }).expect(404); // no es miembro
      await cambiar(ADMIN, idDe(EMPLEADO), { rol: 'EMPLEADO' }).expect(409); // ya tiene ese rol
      await cambiar(ADMIN, idDe(ADMIN), { rol: 'EMPLEADO' }).expect(409); // no el propio
      await cambiar(ADMIN, idDe(SUPER), { rol: 'EMPLEADO' }).expect(403); // SUPER_ADMIN protegido

      const intacto = await prisma.miembroOrganizacion.findUniqueOrThrow({
        where: { id: idDe(SUPER) },
      });
      expect(intacto.rol).toBe('SUPER_ADMIN');
    });
  });

  describe('DELETE /organizaciones/{id}/miembros/{miembroId} (quitar del equipo)', () => {
    const quitar = (quien: string, objetivo: string) =>
      http.delete(url(objetivo)).set(como(quien));

    it('valida los permisos', async () => {
      await quitar(EMPLEADO, idDe(SUPERVISOR)).expect(403);
      await quitar(AJENO, idDe(SUPERVISOR)).expect(404);
      await quitar(ADMIN, idDe(ADMIN)).expect(409); // no a sí mismo
      await quitar(ADMIN, idDe(SUPER)).expect(403);
      await quitar(ADMIN, 'no-es-uuid').expect(400);
    });

    it('un ADMIN quita al miembro: pierde el acceso pero conserva el historial', async () => {
      await quitar(ADMIN, idDe(SUPERVISOR)).expect(204);

      // Soft delete: la membresía sigue en la base como INACTIVO.
      const fila = await prisma.miembroOrganizacion.findUniqueOrThrow({
        where: { id: idDe(SUPERVISOR) },
      });
      expect(fila.estado).toBe('INACTIVO');

      await http
        .get(url(idDe(SUPERVISOR)))
        .set(como(ADMIN))
        .expect(404);
      await quitar(ADMIN, idDe(SUPERVISOR)).expect(404);
      expect(
        (await http.get('/me/membresias').set(como(SUPERVISOR)).expect(200))
          .body,
      ).toEqual([]);
      await http
        .get(`/organizaciones/${orgId}/equipo`)
        .set(como(SUPERVISOR))
        .expect(404);

      const equipo = await http
        .get(`/organizaciones/${orgId}/equipo?pageSize=100`)
        .set(como(ADMIN))
        .expect(200);
      expect(equipo.body.items.map((i: any) => i.email)).not.toContain(
        email(SUPERVISOR),
      );
    });

    it('la persona quitada puede volver con un código de invitación', async () => {
      const { body } = await http
        .post(`/organizaciones/${orgId}/codigos-invitacion`)
        .set(como(ADMIN))
        .send({ rol: 'EMPLEADO', vigenciaMinutos: 5 })
        .expect(201);

      const vuelve = await http
        .post(`/invitaciones/${body.codigo}/aceptar`)
        .set(como(SUPERVISOR))
        .expect(200);
      expect(vuelve.body).toMatchObject({ rol: 'EMPLEADO', estado: 'ACTIVO' });
      expect(
        (await http.get('/me/membresias').set(como(SUPERVISOR)).expect(200))
          .body,
      ).toHaveLength(1);
    });
  });
});
