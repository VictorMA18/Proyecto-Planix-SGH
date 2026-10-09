import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { ReporteAsistenciaResponseDto } from '../dto/reporte-asistencia-response.dto';
import { ReporteQueryDto } from '../dto/reporte-query.dto';
import { ReportesService } from '../services/reportes.service';

@Controller()
@UseGuards(ClerkAuthGuard)
export class ReportesController {
  constructor(
    private readonly reportes: ReportesService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get('organizaciones/:organizacionId/reportes/asistencia')
  async asistencia(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: ReporteQueryDto,
  ): Promise<ReporteAsistenciaResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.reportes.asistencia(usuario, organizacionId, query);
  }
}
