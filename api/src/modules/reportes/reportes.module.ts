import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ReportesController } from './controllers/reportes.controller';
import { ReportesService } from './services/reportes.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
