import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { RelojService } from '../../../common/reloj/reloj.service';
import type { MetricasCalculadas } from '../interfaces/metricas.interface';
import {
  diaConFecha,
  estadoDelDia,
  fechaHoraEmision,
  horaLocal,
  NOMBRE_NIVEL,
  NOMBRE_ROL,
  tituloAlcance,
  tituloPeriodo,
} from '../utils/formato-reporte.util';

const PRIMARIO = 'FF6B46C1';
const TERCIARIO = 'FFEFEAFE';

interface Columna {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

/**
 * Reporte Excel del periodo: hoja «Resumen» con los indicadores, «Colaboradores» (o «Registro
 * diario» si es individual) y «Marcas QR». Los valores son numéricos para que se puedan sumar.
 */
@Injectable()
export class ReporteExcelService {
  constructor(private readonly reloj: RelojService) {}

  async generar(m: MetricasCalculadas): Promise<Buffer> {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'Planix';
    libro.created = this.reloj.ahora();

    this.resumen(libro, m);
    if (m.colaboradores) this.colaboradores(libro, m);
    if (m.registroDiario) this.registro(libro, m);
    this.marcas(libro, m);

    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  private resumen(libro: ExcelJS.Workbook, m: MetricasCalculadas) {
    const hoja = libro.addWorksheet('Resumen', {
      views: [{ showGridLines: false }],
    });
    hoja.columns = [{ width: 30 }, { width: 22 }, { width: 40 }];

    hoja.mergeCells('A1:C1');
    const titulo = hoja.getCell('A1');
    titulo.value = 'Planix · Reporte de asistencia y horas';
    titulo.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titulo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PRIMARIO },
    };
    titulo.alignment = { vertical: 'middle', indent: 1 };
    hoja.getRow(1).height = 32;

    const {
      horas: h,
      puntualidad: p,
      horasExtra: e,
      tendencia: t,
    } = m.agregado;
    const filas: [string, string | number | null, string?][] = [
      ['Organización', m.organizacion.nombre],
      ['Periodo', tituloPeriodo(m), `${m.rango.desde} a ${m.rango.hasta}`],
      [m.alcance === 'EQUIPO' ? 'Alcance' : 'Colaborador', tituloAlcance(m)],
      [
        'Emitido',
        fechaHoraEmision(this.reloj.ahora(), m.organizacion.zonaHoraria),
      ],
      ['', null],
      ['Horas trabajadas', h.trabajadas, 'horas'],
      [
        'Horas planificadas',
        h.planificadas,
        'duración del turno × días de turno',
      ],
      ['Horas restantes', h.restantes, 'horas'],
      ['Cumplimiento', h.cumplimientoPct, '%'],
      ['Promedio diario', t.promedioDiarioHoras, 'horas por día con actividad'],
      ['Variación vs. periodo anterior', t.variacionPct, '%'],
      [
        'Puntualidad',
        p.porcentaje,
        p.nivel ? NOMBRE_NIVEL[p.nivel] : 'Sin entradas con turno',
      ],
      ['Entradas a tiempo', p.aTiempo, `de ${p.evaluadas} con turno`],
      ['Horas extra', e.total, 'por encima de la duración del turno'],
    ];
    if (m.tareas) {
      filas.push([
        'Tareas completadas',
        m.tareas.completadas,
        `de ${m.tareas.total}`,
      ]);
    }
    filas.forEach((fila, i) => {
      const row = hoja.getRow(i + 3);
      row.values = fila;
      row.getCell(1).font = { bold: true, color: { argb: 'FF6E6787' } };
      row.getCell(2).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).font = { color: { argb: 'FF6E6787' } };
    });

    const inicio = filas.length + 5;
    hoja.getCell(`A${inicio}`).value =
      m.tipo === 'SEMANA' ? 'Horas por día' : 'Horas por semana';
    hoja.getCell(`A${inicio}`).font = { bold: true, size: 12 };
    this.encabezado(hoja.getRow(inicio + 1), ['Tramo', 'Horas', 'Fechas']);
    t.barras.forEach((b, i) => {
      hoja.getRow(inicio + 2 + i).values = [
        b.etiqueta,
        b.horas,
        b.desde === b.hasta ? b.desde : `${b.desde} a ${b.hasta}`,
      ];
    });
  }

  private colaboradores(libro: ExcelJS.Workbook, m: MetricasCalculadas) {
    const hoja = this.tabla(libro, 'Colaboradores', [
      { header: 'Colaborador', key: 'nombre', width: 28 },
      { header: 'Correo', key: 'email', width: 30 },
      { header: 'Rol', key: 'rol', width: 14 },
      { header: 'Turno', key: 'turno', width: 18 },
      { header: 'Días trabajados', key: 'dias', width: 15 },
      { header: 'Asistencia %', key: 'asistencia', width: 13, numFmt: '0.0' },
      { header: 'Puntualidad %', key: 'puntualidad', width: 14, numFmt: '0.0' },
      { header: 'Horas', key: 'horas', width: 10, numFmt: '0.0' },
      { header: 'Horas extra', key: 'extra', width: 12, numFmt: '0.0' },
      { header: 'Meta alcanzada', key: 'meta', width: 15 },
    ]);
    for (const c of m.colaboradores ?? []) {
      hoja.addRow({
        nombre: c.nombre,
        email: c.email,
        rol: NOMBRE_ROL[c.rol],
        turno: c.turno ?? 'Sin turno',
        dias: c.diasTrabajados,
        asistencia: c.asistenciaPct,
        puntualidad: c.puntualidadPct,
        horas: c.horas,
        extra: c.horasExtra,
        meta: c.metaAlcanzada ? 'Sí' : 'No',
      });
    }
  }

  private registro(libro: ExcelJS.Workbook, m: MetricasCalculadas) {
    const zona = m.organizacion.zonaHoraria;
    const hoja = this.tabla(libro, 'Registro diario', [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Día', key: 'dia', width: 12 },
      { header: 'Entrada', key: 'entrada', width: 10 },
      { header: 'Salida', key: 'salida', width: 10 },
      { header: 'Horas', key: 'horas', width: 10, numFmt: '0.0' },
      { header: 'Estado', key: 'estado', width: 18 },
      { header: 'Horas extra', key: 'extra', width: 12, numFmt: '0.0' },
      { header: 'Marcas QR', key: 'marcas', width: 11 },
    ]);
    for (const d of [...(m.registroDiario ?? [])].reverse()) {
      hoja.addRow({
        fecha: d.fecha,
        dia: diaConFecha(d.fecha),
        entrada: d.entrada ? horaLocal(d.entrada, zona) : '',
        salida: d.salida ? horaLocal(d.salida, zona) : '',
        horas: d.horas,
        estado: estadoDelDia(d),
        extra: d.horasExtra,
        marcas: d.marcas,
      });
    }
  }

  private marcas(libro: ExcelJS.Workbook, m: MetricasCalculadas) {
    const zona = m.organizacion.zonaHoraria;
    const hoja = this.tabla(libro, 'Marcas QR', [
      { header: 'Colaborador', key: 'nombre', width: 28 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 10 },
    ]);
    for (const marca of m.marcas) {
      hoja.addRow({
        nombre: marca.nombre,
        fecha: marca.fecha,
        hora: horaLocal(marca.hora, zona),
        tipo: marca.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      });
    }
  }

  /** Hoja con encabezado fijo, autofiltro y formato de la marca. */
  private tabla(libro: ExcelJS.Workbook, nombre: string, columnas: Columna[]) {
    const hoja = libro.addWorksheet(nombre, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    hoja.columns = columnas.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width,
      style: c.numFmt ? { numFmt: c.numFmt } : {},
    }));
    this.encabezado(hoja.getRow(1));
    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnas.length },
    };
    return hoja;
  }

  private encabezado(fila: ExcelJS.Row, valores?: string[]) {
    if (valores) fila.values = valores;
    fila.height = 20;
    fila.eachCell((celda) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: PRIMARIO },
      };
      celda.alignment = { vertical: 'middle' };
      celda.border = { bottom: { style: 'thin', color: { argb: TERCIARIO } } };
    });
  }
}
