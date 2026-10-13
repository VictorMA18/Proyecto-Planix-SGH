import { Module } from '@nestjs/common';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { QrModule } from '../qr/qr.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AsistenciaController } from './controllers/asistencia.controller';
import { AsistenciaService } from './services/asistencia.service';
import { JornadasService } from './services/jornadas.service';

@Module({
  imports: [
    UsuariosModule,
    OrganizacionesModule,
    QrModule,
    NotificacionesModule,
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService, JornadasService],
  exports: [JornadasService],
})
export class AsistenciaModule {}
