import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  CambiarEstadoDto,
  CrearComentarioDto,
  MarcarSubtareaDto,
} from '../dto/acciones-tarea.dto';
import {
  ActividadResponseDto,
  ComentarioResponseDto,
} from '../dto/comentario-actividad-response.dto';
import { CrearTareaDto } from '../dto/crear-tarea.dto';
import { SubtareaParamDto, TareaIdParamDto } from '../dto/tarea-params.dto';
import { TareaDetalleResponseDto } from '../dto/tarea-response.dto';
import { TareasService } from '../services/tareas.service';

/** Una tarea: detalle, edición, estado, subtareas, comentarios y actividad. */
@Controller('tareas/:tareaId')
@UseGuards(ClerkAuthGuard)
export class TareaController {
  constructor(
    private readonly tareas: TareasService,
    private readonly usuarios: UsuariosService,
  ) {}

  private usuario(user: AuthenticatedUser) {
    return this.usuarios.obtenerOCrear(user.clerkId);
  }

  @Get()
  async obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
  ): Promise<TareaDetalleResponseDto> {
    return this.tareas.obtener(await this.usuario(user), tareaId);
  }

  @Patch()
  async actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
    @Body() dto: CrearTareaDto,
  ): Promise<TareaDetalleResponseDto> {
    return this.tareas.actualizar(await this.usuario(user), tareaId, dto);
  }

  @Delete()
  @HttpCode(204)
  async eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
  ): Promise<void> {
    await this.tareas.eliminar(await this.usuario(user), tareaId);
  }

  @Post('duplicar')
  async duplicar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
  ): Promise<TareaDetalleResponseDto> {
    return this.tareas.duplicar(await this.usuario(user), tareaId);
  }

  @Patch('estado')
  async estado(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
    @Body() { estado }: CambiarEstadoDto,
  ): Promise<TareaDetalleResponseDto> {
    return this.tareas.cambiarEstado(await this.usuario(user), tareaId, estado);
  }

  @Patch('subtareas/:subtareaId')
  async subtarea(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId, subtareaId }: SubtareaParamDto,
    @Body() { completada }: MarcarSubtareaDto,
  ) {
    return this.tareas.marcarSubtarea(
      await this.usuario(user),
      tareaId,
      subtareaId,
      completada,
    );
  }

  @Get('comentarios')
  async comentarios(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
  ): Promise<ComentarioResponseDto[]> {
    return this.tareas.comentarios(await this.usuario(user), tareaId);
  }

  @Post('comentarios')
  async comentar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
    @Body() { texto }: CrearComentarioDto,
  ): Promise<ComentarioResponseDto> {
    return this.tareas.comentar(await this.usuario(user), tareaId, texto);
  }

  @Get('actividad')
  async actividad(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { tareaId }: TareaIdParamDto,
  ): Promise<ActividadResponseDto[]> {
    return this.tareas.historial(await this.usuario(user), tareaId);
  }
}
