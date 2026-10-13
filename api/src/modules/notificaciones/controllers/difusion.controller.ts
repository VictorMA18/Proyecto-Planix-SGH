import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { DifusionDto } from '../dto/difusion.dto';
import { DifusionResponseDto } from '../dto/notificacion-response.dto';
import { DifusionService } from '../services/difusion.service';

/** Avisos a toda la organización o a los miembros elegidos (ADMIN y SUPERVISOR). */
@Controller('organizaciones/:organizacionId/notificaciones')
@UseGuards(ClerkAuthGuard)
export class DifusionController {
  constructor(
    private readonly difusion: DifusionService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post('difusion')
  async difundir(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Body() dto: DifusionDto,
  ): Promise<DifusionResponseDto> {
    return this.difusion.difundir(
      await this.usuarios.obtenerOCrear(user.clerkId),
      organizacionId,
      dto,
    );
  }
}
