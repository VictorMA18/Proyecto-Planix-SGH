import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkModule } from './clerk/clerk.module';
import { RelojModule } from './common/reloj/reloj.module';
import { AsistenciaModule } from './modules/asistencia/asistencia.module';
import { AuthModule } from './modules/auth/auth.module';
import { EquipoModule } from './modules/equipo/equipo.module';
import { InicioModule } from './modules/inicio/inicio.module';
import { InvitacionesModule } from './modules/invitaciones/invitaciones.module';
import { MiembrosModule } from './modules/miembros/miembros.module';
import { OrganizacionesModule } from './modules/organizaciones/organizaciones.module';
import { QrModule } from './modules/qr/qr.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { TurnosModule } from './modules/turnos/turnos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    RelojModule,
    ClerkModule,
    UsuariosModule,
    AuthModule,
    OrganizacionesModule,
    InvitacionesModule,
    EquipoModule,
    MiembrosModule,
    QrModule,
    TurnosModule,
    AsistenciaModule,
    InicioModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
