import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { MiembroResponseDto } from '../../organizaciones/dto/miembro-response.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { CambiarRolDto } from '../dto/cambiar-rol.dto';
import { MiembroIdParamDto } from '../dto/miembro-id-param.dto';
import { GestionMiembrosService } from '../services/gestion-miembros.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class MiembrosController {
  constructor(
    private readonly miembros: GestionMiembrosService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/miembros/:miembroId')
  async obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId, miembroId }: MiembroIdParamDto,
  ): Promise<MiembroResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.miembros.obtener(usuario, organizacionId, miembroId);
  }

  @Patch('organizaciones/:organizacionId/miembros/:miembroId')
  async cambiarRol(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId, miembroId }: MiembroIdParamDto,
    @Body() dto: CambiarRolDto,
  ): Promise<MiembroResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.miembros.cambiarRol(usuario, organizacionId, miembroId, dto);
  }

  @Delete('organizaciones/:organizacionId/miembros/:miembroId')
  @HttpCode(204)
  async quitar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId, miembroId }: MiembroIdParamDto,
  ): Promise<void> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    await this.miembros.quitar(usuario, organizacionId, miembroId);
  }
}
