import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AdjuntosController } from './controllers/adjuntos.controller';
import { TareaController } from './controllers/tarea.controller';
import { TareasController } from './controllers/tareas.controller';
import { ActividadService } from './services/actividad.service';
import { AdjuntosService } from './services/adjuntos.service';
import { TareasService } from './services/tareas.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [TareasController, TareaController, AdjuntosController],
  providers: [TareasService, ActividadService, AdjuntosService],
  exports: [TareasService],
})
export class TareasModule {}
