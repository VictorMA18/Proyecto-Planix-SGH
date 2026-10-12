import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { CrearTareaDto } from '../dto/crear-tarea.dto';
import {
  TareaCalendarioResponseDto,
  TareaDetalleResponseDto,
} from '../dto/tarea-response.dto';
import { MisTareasQueryDto, TareasQueryDto } from '../dto/tareas-query.dto';
import { TareasService } from '../services/tareas.service';

/** Listados de tareas (calendario) y creación. */
@Controller()
@UseGuards(ClerkAuthGuard)
export class TareasController {
  constructor(
    private readonly tareas: TareasService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/tareas')
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: TareasQueryDto,
  ): Promise<TareaCalendarioResponseDto[]> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.tareas.listar(usuario, organizacionId, query);
  }

  @Post('organizaciones/:organizacionId/tareas')
  async crear(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: CrearTareaDto,
  ): Promise<TareaDetalleResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.tareas.crear(usuario, organizacionId, dto);
  }

  @Get('me/tareas')
  async mias(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MisTareasQueryDto,
  ): Promise<TareaCalendarioResponseDto[]> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.tareas.listarMias(usuario, query);
  }
}
