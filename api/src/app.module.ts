import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkModule } from './clerk/clerk.module';
import { AuthModule } from './modules/auth/auth.module';
import { EquipoModule } from './modules/equipo/equipo.module';
import { InvitacionesModule } from './modules/invitaciones/invitaciones.module';
import { MiembrosModule } from './modules/miembros/miembros.module';
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
    EquipoModule,
    MiembrosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
