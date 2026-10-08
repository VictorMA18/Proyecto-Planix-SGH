import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { MiembroResponseDto } from '../../organizaciones/dto/miembro-response.dto';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { CodigoInvitacionResponseDto } from '../dto/codigo-invitacion-response.dto';
import { CrearCodigoInvitacionDto } from '../dto/crear-codigo-invitacion.dto';
import { CrearInvitacionDto } from '../dto/crear-invitacion.dto';
import { InvitacionIdParamDto } from '../dto/invitacion-id-param.dto';
import { InvitacionPendienteResponseDto } from '../dto/invitacion-pendiente-response.dto';
import { InvitacionCreadaResponseDto } from '../dto/invitacion-response.dto';
import { TokenParamDto } from '../dto/token-param.dto';
import { CodigosInvitacionService } from '../services/codigos-invitacion.service';
import { InvitacionesService } from '../services/invitaciones.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class InvitacionesController {
  constructor(
    private readonly invitaciones: InvitacionesService,
    private readonly codigos: CodigosInvitacionService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post('organizaciones/:organizacionId/invitaciones')
  @HttpCode(201)
  async crear(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: CrearInvitacionDto,
  ): Promise<InvitacionCreadaResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.invitaciones.crear(usuario, organizacionId, dto);
  }

  @Post('organizaciones/:organizacionId/codigos-invitacion')
  @HttpCode(201)
  async crearCodigo(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: CrearCodigoInvitacionDto,
  ): Promise<CodigoInvitacionResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.codigos.crear(usuario, organizacionId, dto);
  }

  @Post('invitaciones/:invitacionId/reenviar')
  @HttpCode(200)
  async reenviar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { invitacionId }: InvitacionIdParamDto,
  ): Promise<InvitacionPendienteResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.invitaciones.reenviar(usuario, invitacionId);
  }

  @Post('invitaciones/:token/aceptar')
  @HttpCode(200)
  async aceptar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { token }: TokenParamDto,
  ): Promise<MiembroResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.invitaciones.aceptar(usuario, token);
  }
}
