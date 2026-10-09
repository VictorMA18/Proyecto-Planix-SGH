import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { QrResponseDto } from '../dto/qr-response.dto';
import { QrService } from '../services/qr.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class QrController {
  constructor(
    private readonly qr: QrService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/qr/hoy')
  async hoy(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
  ): Promise<QrResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.qr.vigente(usuario, organizacionId);
  }
}
