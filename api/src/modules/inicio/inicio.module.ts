import { Module } from '@nestjs/common';
import { AsistenciaModule } from '../asistencia/asistencia.module';
import { QrModule } from '../qr/qr.module';
import { TareasModule } from '../tareas/tareas.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { InicioController } from './controllers/inicio.controller';
import { InicioService } from './services/inicio.service';

@Module({
  imports: [UsuariosModule, AsistenciaModule, QrModule, TareasModule],
  controllers: [InicioController],
  providers: [InicioService],
})
export class InicioModule {}
