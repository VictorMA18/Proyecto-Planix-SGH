import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { AsistenciaHoyResponseDto } from '../dto/asistencia-hoy-response.dto';
import { HistorialQueryDto } from '../dto/historial-query.dto';
import {
  JornadaResponseDto,
  PaginaJornadasResponseDto,
} from '../dto/jornada-response.dto';
import { OrganizacionAsistenciaDto } from '../dto/organizacion-asistencia.dto';
import { RegistrarEntradaDto } from '../dto/registrar-entrada.dto';
import { AsistenciaService } from '../services/asistencia.service';

@Controller('asistencia')
@UseGuards(ClerkAuthGuard)
export class AsistenciaController {
  constructor(
    private readonly asistencia: AsistenciaService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Post('entrada')
  async entrada(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { token }: RegistrarEntradaDto,
  ): Promise<JornadaResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.asistencia.registrarEntrada(usuario, token);
  }

  @Post('salida')
  @HttpCode(200)
  async salida(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { organizacionId }: OrganizacionAsistenciaDto,
  ): Promise<JornadaResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.asistencia.registrarSalida(usuario, organizacionId);
  }

  @Get('hoy')
  async hoy(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { organizacionId }: OrganizacionAsistenciaDto,
  ): Promise<AsistenciaHoyResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.asistencia.hoy(usuario, organizacionId);
  }

  @Get('historial')
  async historial(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: HistorialQueryDto,
  ): Promise<PaginaJornadasResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.asistencia.historial(usuario, query);
  }
}
