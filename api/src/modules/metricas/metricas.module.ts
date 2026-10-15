import { Module } from '@nestjs/common';
import { OrganizacionesModule } from '../organizaciones/organizaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { MetricasController } from './controllers/metricas.controller';
import { MetricasService } from './services/metricas.service';
import { ReporteExcelService } from './services/reporte-excel.service';
import { ReporteMetricasService } from './services/reporte-metricas.service';
import { ReportePdfService } from './services/reporte-pdf.service';

@Module({
  imports: [UsuariosModule, OrganizacionesModule],
  controllers: [MetricasController],
  providers: [
    MetricasService,
    ReporteMetricasService,
    ReportePdfService,
    ReporteExcelService,
  ],
})
export class MetricasModule {}
