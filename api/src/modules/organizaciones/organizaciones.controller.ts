import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsuariosService } from '../auth/usuarios.service';
import { OrganizacionesService } from './organizaciones.service';
import { validarCrearOrganizacion } from './organizaciones.validation';

@Controller()
@UseGuards(ClerkAuthGuard)
export class OrganizacionesController {
  constructor(
    private readonly organizaciones: OrganizacionesService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('me/membresias')
  async misMembresias(@CurrentUser() user: AuthenticatedUser) {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.organizaciones.listarMembresias(usuario.id);
  }

  @Post('organizaciones')
  @HttpCode(201)
  async crear(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const datos = validarCrearOrganizacion(body);
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.organizaciones.crear(usuario.id, datos);
  }
}
