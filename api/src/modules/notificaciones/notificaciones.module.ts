import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { DifusionController } from './controllers/difusion.controller';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { PreferenciasController } from './controllers/preferencias.controller';
import { PushTokensController } from './controllers/push-tokens.controller';
import { BandejaService } from './services/bandeja.service';
import { DifusionService } from './services/difusion.service';
import { NotificacionesService } from './services/notificaciones.service';
import { PreferenciasService } from './services/preferencias.service';
import { PushTokensService } from './services/push-tokens.service';
import { RecordatoriosService } from './services/recordatorios.service';

/** Centro de notificaciones: bandeja, preferencias, push tokens, difusión y recordatorios. */
@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [
    NotificacionesController,
    PreferenciasController,
    PushTokensController,
    DifusionController,
  ],
  providers: [
    NotificacionesService,
    BandejaService,
    PreferenciasService,
    PushTokensService,
    DifusionService,
    RecordatoriosService,
  ],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
