import { Injectable } from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import { ReporteMetricasQueryDto } from '../dto/metricas-query.dto';
import { nombreArchivo } from '../utils/formato-reporte.util';
import { MetricasService } from './metricas.service';
import { ReporteExcelService } from './reporte-excel.service';
import { ReportePdfService } from './reporte-pdf.service';

export interface ArchivoReporte {
  contenido: Buffer;
  nombre: string;
  tipo: string;
}

const TIPO_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Reporte descargable del periodo: mismas métricas (y permisos) que la pestaña Métricas. */
@Injectable()
export class ReporteMetricasService {
  constructor(
    private readonly metricas: MetricasService,
    private readonly pdf: ReportePdfService,
    private readonly excel: ReporteExcelService,
  ) {}

  async generar(
    usuario: Usuario,
    organizacionId: string,
    query: ReporteMetricasQueryDto,
  ): Promise<ArchivoReporte> {
    const datos = await this.metricas.calcular(
      usuario,
      organizacionId,
      query,
      query.miembroId,
    );
    return query.formato === 'PDF'
      ? {
          contenido: await this.pdf.generar(datos),
          nombre: nombreArchivo(datos, 'pdf'),
          tipo: 'application/pdf',
        }
      : {
          contenido: await this.excel.generar(datos),
          nombre: nombreArchivo(datos, 'xlsx'),
          tipo: TIPO_XLSX,
        };
  }
}
