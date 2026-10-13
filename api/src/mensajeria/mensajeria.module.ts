import { Global, Module } from '@nestjs/common';
import { ColaPushService } from './cola-push.service';
import { DespachoPushController } from './despacho-push.controller';
import { DespachoPushService } from './despacho-push.service';
import { ExpoPushService } from './expo-push.service';
import { WebPushService } from './web-push.service';

/** Push asíncrono: cola en RabbitMQ, consumidor y proveedores (Expo y Web Push). */
@Global()
@Module({
  controllers: [DespachoPushController],
  providers: [
    ColaPushService,
    DespachoPushService,
    ExpoPushService,
    WebPushService,
  ],
  exports: [ColaPushService, WebPushService],
})
export class MensajeriaModule {}
