import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { EquipoQueryDto } from '../dto/equipo-query.dto';
import { PaginaEquipoResponseDto } from '../dto/pagina-equipo-response.dto';
import { EquipoService } from '../services/equipo.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class EquipoController {
  constructor(
    private readonly equipo: EquipoService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/equipo')
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: EquipoQueryDto,
  ): Promise<PaginaEquipoResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.equipo.listar(usuario, organizacionId, query);
  }
}
