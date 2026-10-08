import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { CrearOrganizacionDto } from '../dto/crear-organizacion.dto';
import { MembresiaResponseDto } from '../dto/membresia-response.dto';
import { OrganizacionResponseDto } from '../dto/organizacion-response.dto';
import { OrganizacionesService } from '../services/organizaciones.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class OrganizacionesController {
  constructor(
    private readonly organizaciones: OrganizacionesService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('me/membresias')
  async misMembresias(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MembresiaResponseDto[]> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.organizaciones.listarMembresias(usuario.id);
  }

  @Post('organizaciones')
  @HttpCode(201)
  async crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CrearOrganizacionDto,
  ): Promise<OrganizacionResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.organizaciones.crear(usuario.id, dto);
  }
}
