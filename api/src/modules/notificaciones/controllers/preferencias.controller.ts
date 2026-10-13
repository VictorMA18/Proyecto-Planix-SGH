import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { PreferenciasResponseDto } from '../dto/notificacion-response.dto';
import { PreferenciasNotificacionDto } from '../dto/preferencias-notificacion.dto';
import { PreferenciasService } from '../services/preferencias.service';

/** Preferencias de notificación del usuario autenticado. */
@Controller('me/preferencias-notificacion')
@UseGuards(ClerkAuthGuard)
export class PreferenciasController {
  constructor(
    private readonly preferencias: PreferenciasService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get()
  async obtener(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PreferenciasResponseDto> {
    return this.preferencias.obtener(
      await this.usuarios.obtenerOCrear(user.clerkId),
    );
  }

  @Put()
  async guardar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreferenciasNotificacionDto,
  ): Promise<PreferenciasResponseDto> {
    return this.preferencias.guardar(
      await this.usuarios.obtenerOCrear(user.clerkId),
      dto,
    );
  }
}
