import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './auth.guard';
import type { AuthenticatedUser } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { UsuariosService } from './usuarios.service';

@Controller('auth')
@UseGuards(ClerkAuthGuard)
export class AuthController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usuarios.obtenerOCrear(user.clerkId);
  }
}
