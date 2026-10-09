import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TurnosController } from './controllers/turnos.controller';
import { TurnosService } from './services/turnos.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}
