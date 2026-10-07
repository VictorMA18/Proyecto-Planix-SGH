import { existsSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Las credenciales viven en api/.env; Nest no lo carga por sí solo.
  if (existsSync('.env')) process.loadEnvFile('.env');

  // rawBody: la firma de los webhooks de Clerk (Svix) se valida sobre el cuerpo sin re-serializar.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('v1');
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend NestJS SGH ejecutándose en: http://localhost:${port}/v1`);
}
bootstrap();
