import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { InicioMioResponseDto } from '../dto/inicio-mio-response.dto';
import { PanelResponseDto } from '../dto/panel-response.dto';
import { InicioService } from '../services/inicio.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class InicioController {
  constructor(
    private readonly inicio: InicioService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/inicio/mio')
  async mio(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
  ): Promise<InicioMioResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.inicio.mio(usuario, organizacionId);
  }

  @Get('organizaciones/:organizacionId/inicio/panel')
  async panel(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
  ): Promise<PanelResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.inicio.panel(usuario, organizacionId);
  }
}
