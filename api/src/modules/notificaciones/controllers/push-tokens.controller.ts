import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  ClaveWebResponseDto,
  PushTokenResponseDto,
} from '../dto/notificacion-response.dto';
import {
  QuitarPushTokenDto,
  RegistrarPushTokenDto,
} from '../dto/push-token.dto';
import { PushTokensService } from '../services/push-tokens.service';

/** Dispositivos y navegadores que reciben push. */
@Controller('push-tokens')
@UseGuards(ClerkAuthGuard)
export class PushTokensController {
  constructor(
    private readonly tokens: PushTokensService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post()
  async registrar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegistrarPushTokenDto,
  ): Promise<PushTokenResponseDto> {
    return this.tokens.registrar(
      await this.usuarios.obtenerOCrear(user.clerkId),
      dto,
    );
  }

  @Delete()
  @HttpCode(204)
  async quitar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuitarPushTokenDto,
  ): Promise<void> {
    await this.tokens.quitar(
      await this.usuarios.obtenerOCrear(user.clerkId),
      dto,
    );
  }

  @Get('clave-web')
  claveWeb(): ClaveWebResponseDto {
    return this.tokens.claveWeb();
  }
}
