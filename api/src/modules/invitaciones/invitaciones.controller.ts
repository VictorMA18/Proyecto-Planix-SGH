import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsuariosService } from '../auth/usuarios.service';
import { InvitacionesService } from './invitaciones.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class InvitacionesController {
  constructor(
    private readonly invitaciones: InvitacionesService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post('organizaciones/:organizacionId/invitaciones')
  @HttpCode(201)
  async crear(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizacionId', ParseUUIDPipe) organizacionId: string,
    @Body() body: unknown,
  ) {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.invitaciones.crear(usuario, organizacionId, body);
  }

  @Post('invitaciones/:token/aceptar')
  @HttpCode(200)
  async aceptar(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.invitaciones.aceptar(usuario, token);
  }
}
