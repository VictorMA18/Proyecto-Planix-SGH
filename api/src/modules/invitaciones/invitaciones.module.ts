import { Module } from '@nestjs/common';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { InvitacionesController } from './controllers/invitaciones.controller';
import { CodigosInvitacionService } from './services/codigos-invitacion.service';
import { InvitacionesService } from './services/invitaciones.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule, NotificacionesModule],
  controllers: [InvitacionesController],
  providers: [InvitacionesService, CodigosInvitacionService],
})
export class InvitacionesModule {}
