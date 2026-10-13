import { Module } from '@nestjs/common';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TurnosController } from './controllers/turnos.controller';
import { TurnosService } from './services/turnos.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule, NotificacionesModule],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}
