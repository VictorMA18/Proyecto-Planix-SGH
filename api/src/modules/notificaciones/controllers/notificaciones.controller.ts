import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  LeerTodasResponseDto,
  NotificacionResponseDto,
} from '../dto/notificacion-response.dto';
import {
  NotificacionIdParamDto,
  NotificacionesQueryDto,
  OrganizacionOpcionalQueryDto,
} from '../dto/notificaciones-query.dto';
import { BandejaService } from '../services/bandeja.service';

/** Bandeja del usuario autenticado. */
@Controller('notificaciones')
@UseGuards(ClerkAuthGuard)
export class NotificacionesController {
  constructor(
    private readonly bandeja: BandejaService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get()
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificacionesQueryDto,
  ): Promise<NotificacionResponseDto[]> {
    return this.bandeja.listar(
      await this.usuarios.obtenerOCrear(user.clerkId),
      query,
    );
  }

  // Antes que `:notificacionId/leer` para que «leer-todas» no se tome como un id.
  @Patch('leer-todas')
  async leerTodas(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { organizacionId }: OrganizacionOpcionalQueryDto,
  ): Promise<LeerTodasResponseDto> {
    return this.bandeja.leerTodas(
      await this.usuarios.obtenerOCrear(user.clerkId),
      organizacionId,
    );
  }

  @Patch(':notificacionId/leer')
  async leer(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { notificacionId }: NotificacionIdParamDto,
  ): Promise<NotificacionResponseDto> {
    return this.bandeja.leer(
      await this.usuarios.obtenerOCrear(user.clerkId),
      notificacionId,
    );
  }
}
