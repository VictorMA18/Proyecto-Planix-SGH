import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkModule } from './clerk/clerk.module';
import { AuthModule } from './modules/auth/auth.module';
import { InvitacionesModule } from './modules/invitaciones/invitaciones.module';
import { OrganizacionesModule } from './modules/organizaciones/organizaciones.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClerkModule,
    UsuariosModule,
    AuthModule,
    OrganizacionesModule,
    InvitacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
