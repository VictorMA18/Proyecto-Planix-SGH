import {
  Controller,
  Get,
  Param,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { OrganizacionIdParamDto } from '../../organizaciones/dto/organizacion-id-param.dto';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import {
  ColaboradoresQueryDto,
  MetricasQueryDto,
  ReporteMetricasQueryDto,
} from '../dto/metricas-query.dto';
import {
  MetricasPeriodoResponseDto,
  PaginaColaboradoresResponseDto,
} from '../dto/metricas-response.dto';
import { MetricasService } from '../services/metricas.service';
import { ReporteMetricasService } from '../services/reporte-metricas.service';

@Controller('organizaciones/:organizacionId/metricas')
@UseGuards(ClerkAuthGuard)
export class MetricasController {
  constructor(
    private readonly metricas: MetricasService,
    private readonly reporte: ReporteMetricasService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get()
  async periodo(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: MetricasQueryDto,
  ): Promise<MetricasPeriodoResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.metricas.metricas(usuario, organizacionId, query);
  }

  @Get('colaboradores')
  async colaboradores(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: ColaboradoresQueryDto,
  ): Promise<PaginaColaboradoresResponseDto> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    return this.metricas.colaboradores(usuario, organizacionId, query);
  }

  @Get('reporte')
  async descargar(
    @CurrentUser() user: AuthenticatedUser,
    @Param() { organizacionId }: OrganizacionIdParamDto,
    @Query() query: ReporteMetricasQueryDto,
  ): Promise<StreamableFile> {
    const usuario = await this.usuarios.obtenerOCrear(user.clerkId);
    const archivo = await this.reporte.generar(usuario, organizacionId, query);
    return new StreamableFile(archivo.contenido, {
      type: archivo.tipo,
      disposition: `attachment; filename="${archivo.nombre}"`,
      length: archivo.contenido.length,
    });
  }
}
