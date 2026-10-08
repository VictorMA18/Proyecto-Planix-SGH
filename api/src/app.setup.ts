import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuración común de la app (la usan `main.ts` y los tests e2e): validación global de los DTO.
 * `whitelist` descarta campos desconocidos y `forbidNonWhitelisted` los rechaza con 400.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
}
