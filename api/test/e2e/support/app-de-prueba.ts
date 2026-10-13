import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import type { RolMiembro } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { CloudinaryService } from '../../../src/cloudinary/cloudinary.service';
import { configureApp } from '../../../src/app.setup';
import { ClerkAuthGuard } from '../../../src/common/guards/clerk-auth.guard';
import { RelojService } from '../../../src/common/reloj/reloj.service';
import { ColaPushService } from '../../../src/mensajeria/cola-push.service';
import type { MensajePush } from '../../../src/mensajeria/mensaje-push.interface';
import { PrismaService } from '../../../src/prisma/prisma.service';

// Piezas comunes de los e2e de asistencia: el guard de Clerk se reemplaza por la cabecera
// `x-test-clerk-id` y el reloj por uno fijo. Todo lo creado lleva el prefijo `e2e_` y se borra.

/** Reloj controlable: `fijar('2026-10-09T13:05:00Z')`. */
export class RelojDePrueba {
  instante = new Date();
  ahora(): Date {
    return new Date(this.instante);
  }
  fijar(iso: string) {
    this.instante = new Date(iso);
  }
  avanzarMin(minutos: number) {
    this.instante = new Date(this.instante.getTime() + minutos * 60_000);
  }
}

/** Doble de Cloudinary: guarda lo subido y lo borrado en memoria, sin red ni credenciales. */
export class CloudinaryDePrueba {
  subidos: { carpeta: string; bytes: number }[] = [];
  eliminados: string[] = [];
  private contenidos = new Map<string, Buffer>();
  subir(buffer: Buffer, carpeta: string) {
    this.subidos.push({ carpeta, bytes: buffer.length });
    const n = this.subidos.length;
    const url = `https://res.cloudinary.test/${n}`;
    this.contenidos.set(url, buffer);
    return Promise.resolve({ url, publicId: `prueba/${n}` });
  }
  descargar(url: string) {
    return Promise.resolve(this.contenidos.get(url) ?? Buffer.alloc(0));
  }
  eliminar(publicId: string) {
    this.eliminados.push(publicId);
    return Promise.resolve();
  }
}

/** Doble de la cola de RabbitMQ: guarda los push encolados, sin red. */
export class ColaPushDePrueba {
  mensajes: MensajePush[] = [];
  publicar(mensaje: MensajePush) {
    this.mensajes.push(mensaje);
    return Promise.resolve();
  }
  /** Push encolados para un usuario. */
  para(usuarioId: string) {
    return this.mensajes.filter((m) => m.usuarioIds.includes(usuarioId));
  }
}

export interface AppDePrueba {
  app: INestApplication;
  http: ReturnType<typeof request>;
  prisma: PrismaService;
  reloj: RelojDePrueba;
  cloudinary: CloudinaryDePrueba;
  cola: ColaPushDePrueba;
}

export async function crearAppDePrueba(): Promise<AppDePrueba> {
  const reloj = new RelojDePrueba();
  const cloudinary = new CloudinaryDePrueba();
  const cola = new ColaPushDePrueba();
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
    .overrideProvider(RelojService)
    .useValue(reloj)
    .overrideProvider(CloudinaryService)
    .useValue(cloudinary)
    .overrideProvider(ColaPushService)
    .useValue(cola)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  // Los recordatorios se prueban llamando `ejecutar()` con el reloj fijo, no con el cron real.
  const programador = app.get(SchedulerRegistry);
  for (const nombre of programador.getCronJobs().keys()) {
    programador.deleteCronJob(nombre);
  }
  return {
    app,
    http: request(app.getHttpServer()),
    prisma: app.get(PrismaService),
    reloj,
    cloudinary,
    cola,
  };
}

export const como = (clerkId: string) => ({ 'x-test-clerk-id': clerkId });

export interface Escenario {
  orgId: string;
  /** clerkId de cada persona, por su clave. */
  clerk: Record<string, string>;
  /** Id de membresía de cada persona, por su clave. */
  miembro: Record<string, string>;
}

/**
 * Crea los usuarios y una organización de la que `admin` es ADMIN; el resto entra con su rol.
 * Las claves sin rol (`null`) solo crean el usuario (personas ajenas a la organización).
 */
export async function crearEscenario(
  { http, prisma }: AppDePrueba,
  nombre: string,
  personas: Record<string, RolMiembro | null>,
): Promise<Escenario> {
  const sufijo = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const clerk: Record<string, string> = {};
  for (const clave of ['admin', ...Object.keys(personas)]) {
    clerk[clave] = `e2e_${nombre}_${clave}_${sufijo}`;
    await prisma.usuario.create({
      data: {
        clerkId: clerk[clave],
        nombre: `${clave[0].toUpperCase()}${clave.slice(1)} E2E`,
        email: `${clerk[clave]}@example.test`,
        emailVerificado: true,
      },
    });
  }

  const orgId = (
    await http
      .post('/organizaciones')
      .set(como(clerk.admin))
      .send({ nombre: `E2E ${nombre} ${sufijo}`, zonaHoraria: 'America/Lima' })
      .expect(201)
  ).body.id as string;

  for (const [clave, rol] of Object.entries(personas)) {
    if (!rol) continue;
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { clerkId: clerk[clave] },
    });
    await prisma.miembroOrganizacion.create({
      data: {
        usuarioId: usuario.id,
        organizacionId: orgId,
        rol,
        estado: 'ACTIVO',
        fechaIngreso: new Date(),
      },
    });
  }

  const miembros = await prisma.miembroOrganizacion.findMany({
    where: { organizacionId: orgId },
    include: { usuario: true },
  });
  const miembro: Record<string, string> = {};
  for (const [clave, clerkId] of Object.entries(clerk)) {
    const m = miembros.find((x) => x.usuario.clerkId === clerkId);
    if (m) miembro[clave] = m.id;
  }
  return { orgId, clerk, miembro };
}

/** Borra las organizaciones (y en cascada QR, jornadas y turnos) y los usuarios del escenario. */
export async function limpiarEscenario(
  { prisma }: AppDePrueba,
  escenario: Escenario | undefined,
) {
  if (!escenario) return;
  const usuarios = await prisma.usuario.findMany({
    where: { clerkId: { in: Object.values(escenario.clerk) } },
    select: { id: true },
  });
  const ids = usuarios.map((u) => u.id);
  await prisma.organizacion.deleteMany({
    where: { miembros: { some: { usuarioId: { in: ids } } } },
  });
  await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
}
