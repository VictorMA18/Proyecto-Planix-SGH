import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClerkAuthGuard } from './auth.guard';
import { ClerkService } from './clerk.service';
import { UsuariosService } from './usuarios.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  controllers: [AuthController, WebhooksController],
  providers: [ClerkAuthGuard, ClerkService, UsuariosService],
  exports: [ClerkAuthGuard, ClerkService, UsuariosService],
})
export class AuthModule {}
