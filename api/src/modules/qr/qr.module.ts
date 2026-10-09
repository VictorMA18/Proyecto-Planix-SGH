import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { QrController } from './controllers/qr.controller';
import { QrService } from './services/qr.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
