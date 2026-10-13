import { existsSync } from 'fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { COLA_PUSH } from './mensajeria/mensaje-push.interface';

async function bootstrap() {
  // Las credenciales viven en api/.env; Nest no lo carga por sí solo.
  if (existsSync('.env')) process.loadEnvFile('.env');

  // rawBody: la firma de los webhooks de Clerk (Svix) se valida sobre el cuerpo sin re-serializar.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('v1');
  app.enableCors();
  configureApp(app);

  // Consumidor de la cola de push (documentacion/06, flujo 9). Sin RabbitMQ la API funciona igual:
  // las notificaciones quedan en la bandeja y solo se omite el push.
  if (process.env.RABBITMQ_URL) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: COLA_PUSH,
        queueOptions: { durable: true },
      },
    });
    await app.startAllMicroservices();
  } else {
    new Logger('Bootstrap').warn(
      'RABBITMQ_URL sin configurar: no se enviarán notificaciones push.',
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(
    `Backend NestJS SGH ejecutándose en: http://localhost:${port}/v1`,
  );
}
void bootstrap();
