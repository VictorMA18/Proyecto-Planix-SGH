import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { OrganizacionesController } from './controllers/organizaciones.controller';
import { AccesoOrganizacionService } from './services/acceso-organizacion.service';
import { MiembrosService } from './services/miembros.service';
import { OrganizacionesService } from './services/organizaciones.service';

@Module({
  imports: [UsuariosModule],
  controllers: [OrganizacionesController],
  providers: [
    OrganizacionesService,
    AccesoOrganizacionService,
    MiembrosService,
  ],
  exports: [AccesoOrganizacionService, MiembrosService],
})
export class OrganizacionesModule {}
