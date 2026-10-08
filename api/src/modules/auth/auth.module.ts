import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './controllers/auth.controller';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController, WebhooksController],
})
export class AuthModule {}
