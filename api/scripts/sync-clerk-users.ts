/**
 * Sincroniza hacia la tabla `usuarios` todos los usuarios que ya existen en Clerk.
 * Es idempotente: crea los que faltan y actualiza los demás; nunca borra ni desactiva.
 *
 * Uso (desde api/):  pnpm sync:usuarios
 */
import { existsSync } from 'fs';

if (existsSync('.env')) process.loadEnvFile('.env');

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ClerkService } from '../src/modules/auth/clerk.service';
import { datosDesdeUsuarioClerk, UsuariosService } from '../src/modules/auth/usuarios.service';
import { PrismaService } from '../src/prisma/prisma.service';

const TAMANO_PAGINA = 100;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const clerk = app.get(ClerkService);
  const usuarios = app.get(UsuariosService);
  const prisma = app.get(PrismaService);

  const stats = { leidos: 0, creados: 0, actualizados: 0, errores: 0 };

  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const { data } = await clerk.client.users.getUserList({
      limit: TAMANO_PAGINA,
      offset,
      orderBy: 'created_at',
    });

    for (const usuarioClerk of data) {
      stats.leidos++;
      try {
        const existente = await prisma.usuario.findUnique({
          where: { clerkId: usuarioClerk.id },
          select: { id: true },
        });
        await usuarios.sincronizar(datosDesdeUsuarioClerk(usuarioClerk));
        if (existente) stats.actualizados++;
        else stats.creados++;
      } catch (err: any) {
        stats.errores++;
        console.error(`✗ ${usuarioClerk.id}: ${err.message}`);
      }
    }

    if (data.length < TAMANO_PAGINA) break;
  }

  console.log(
    `Usuarios de Clerk leídos: ${stats.leidos} | creados: ${stats.creados} | actualizados: ${stats.actualizados} | con error: ${stats.errores}`,
  );
  await app.close();
  if (stats.errores > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
