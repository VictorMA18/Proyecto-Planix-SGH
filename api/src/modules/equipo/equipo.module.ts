import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EquipoController } from './controllers/equipo.controller';
import { EquipoService } from './services/equipo.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [EquipoController],
  providers: [EquipoService],
})
export class EquipoModule {}
