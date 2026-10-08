import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { MiembrosController } from './controllers/miembros.controller';
import { GestionMiembrosService } from './services/gestion-miembros.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [MiembrosController],
  providers: [GestionMiembrosService],
})
export class MiembrosModule {}
