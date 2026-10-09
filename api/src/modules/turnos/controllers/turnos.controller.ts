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
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  ConfiguracionTurnosResponseDto,
  PlantillaTurnoResponseDto,
} from '../dto/configuracion-turnos-response.dto';
import { PlantillaTurnoDto } from '../dto/plantilla-turno.dto';
import { ToleranciaDto } from '../dto/tolerancia.dto';
import { TurnoIdParamDto } from '../dto/turno-id-param.dto';
import { TurnosService } from '../services/turnos.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class TurnosController {
  constructor(
    private readonly turnos: TurnosService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/turnos')
  async configuracion(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
  ): Promise<ConfiguracionTurnosResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.turnos.configuracion(usuario, organizacionId);
  }

  @Post('organizaciones/:organizacionId/turnos')
  async crear(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: PlantillaTurnoDto,
  ): Promise<PlantillaTurnoResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.turnos.crear(usuario, organizacionId, dto);
  }

  // Antes de `turnos/:turnoId` para que «tolerancia» no se tome como un identificador.
  @Patch('organizaciones/:organizacionId/turnos/tolerancia')
  async cambiarTolerancia(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: ToleranciaDto,
  ): Promise<ConfiguracionTurnosResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.turnos.cambiarTolerancia(usuario, organizacionId, dto);
  }

  @Patch('organizaciones/:organizacionId/turnos/:turnoId')
  async actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId, turnoId }: TurnoIdParamDto,
    @Body() dto: PlantillaTurnoDto,
  ): Promise<PlantillaTurnoResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.turnos.actualizar(usuario, organizacionId, turnoId, dto);
  }

  @Delete('organizaciones/:organizacionId/turnos/:turnoId')
  @HttpCode(204)
  async eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId, turnoId }: TurnoIdParamDto,
  ): Promise<void> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    await this.turnos.eliminar(usuario, organizacionId, turnoId);
  }
}
