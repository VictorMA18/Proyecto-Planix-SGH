import { Module } from '@nestjs/common';
import { AsistenciaModule } from '../asistencia/asistencia.module';
import { QrModule } from '../qr/qr.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { InicioController } from './controllers/inicio.controller';
import { InicioService } from './services/inicio.service';

@Module({
  imports: [UsuariosModule, AsistenciaModule, QrModule],
  controllers: [InicioController],
  providers: [InicioService],
})
export class InicioModule {}
