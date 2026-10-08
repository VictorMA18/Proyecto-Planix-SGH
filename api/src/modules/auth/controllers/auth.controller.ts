import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';

@Controller('auth')
@UseGuards(ClerkAuthGuard)
export class AuthController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get('me')
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UsuarioResponseDto> {
    return UsuarioResponseDto.desde(
      await this.usuarios.obtenerOCrear(user.clerkId),
    );
  }
}
