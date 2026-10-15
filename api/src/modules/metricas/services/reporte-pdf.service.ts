import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { RelojService } from '../../../common/reloj/reloj.service';
import type { MetricasCalculadas } from '../interfaces/metricas.interface';
import {
  diaConFecha,
  estadoDelDia,
  fechaHoraEmision,
  horaLocal,
  horas,
  NOMBRE_NIVEL,
  NOMBRE_ROL,
  pct,
  tituloAlcance,
  tituloPeriodo,
} from '../utils/formato-reporte.util';

type Doc = PDFKit.PDFDocument;

/** Paleta de la app (constants/theme del cliente). */
const COLOR = {
  primario: '#6B46C1',
  primarioSuave: '#A58BEA',
  terciario: '#EFEAFE',
  texto: '#1F1A2E',
  apagado: '#6E6787',
  borde: '#E4DFF5',
  fondoFila: '#F8F6FE',
  exito: '#1F9D55',
  aviso: '#B7791F',
};

const MARGEN = 40;
const ANCHO = 595.28 - MARGEN * 2;
const LIMITE_Y = 841.89 - MARGEN - 28;
/** Alto de una línea de texto de 8 pt en las tablas. */
const ALTO_LINEA = 10;

interface Columna {
  titulo: string;
  ancho: number;
  alinear?: 'left' | 'right' | 'center';
}

/**
 * Reporte PDF (A4) del periodo: encabezado con la marca, indicadores, gráfico de horas, desglose
 * por colaborador (o registro diario si es individual) y el anexo con las marcas de QR.
 */
@Injectable()
export class ReportePdfService {
  constructor(private readonly reloj: RelojService) {}

  generar(m: MetricasCalculadas): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGEN,
      bufferPages: true,
      info: {
        Title: `Reporte de asistencia y horas · ${m.organizacion.nombre}`,
        Author: 'Planix',
        Subject: tituloPeriodo(m),
      },
    });
    const partes: Buffer[] = [];
    doc.on('data', (parte: Buffer) => partes.push(parte));
    const listo = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);
    });

    this.encabezado(doc, m);
    this.indicadores(doc, m);
    this.grafico(doc, m);
    if (m.colaboradores) this.tablaColaboradores(doc, m);
    if (m.registroDiario) this.tablaRegistro(doc, m);
    this.anexoMarcas(doc, m);
    this.pies(doc, m);
    doc.end();
    return listo;
  }

  private encabezado(doc: Doc, m: MetricasCalculadas) {
    doc.rect(0, 0, doc.page.width, 104).fill(COLOR.primario);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Planix', MARGEN, 30);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#E9E3FB')
      .text('Reporte de asistencia y horas', MARGEN, 58);

    const derecha = { width: ANCHO / 2, align: 'right' as const };
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#FFFFFF')
      .text(m.organizacion.nombre, MARGEN + ANCHO / 2, 32, derecha);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#E9E3FB')
      .text(tituloPeriodo(m), MARGEN + ANCHO / 2, 50, derecha)
      .text(
        `Emitido: ${fechaHoraEmision(this.reloj.ahora(), m.organizacion.zonaHoraria)}`,
        MARGEN + ANCHO / 2,
        64,
        derecha,
      );

    doc
      .fillColor(COLOR.apagado)
      .font('Helvetica')
      .fontSize(9)
      .text(m.alcance === 'EQUIPO' ? 'ALCANCE' : 'COLABORADOR', MARGEN, 124);
    doc
      .fillColor(COLOR.texto)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(tituloAlcance(m), MARGEN, 137);
    doc.y = 166;
  }

  private indicadores(doc: Doc, m: MetricasCalculadas) {
    const { horas: h, puntualidad: p, horasExtra: e } = m.agregado;
    const tarjetas = [
      {
        titulo: 'Horas trabajadas',
        valor: horas(h.trabajadas),
        detalle: `de ${horas(h.planificadas)} planificadas`,
      },
      {
        titulo: 'Cumplimiento',
        valor: pct(h.cumplimientoPct),
        detalle: `${horas(h.restantes)} restantes`,
      },
      {
        titulo: 'Puntualidad',
        valor: pct(p.porcentaje),
        detalle: p.nivel
          ? `${p.aTiempo}/${p.evaluadas} a tiempo · ${NOMBRE_NIVEL[p.nivel]}`
          : 'Sin entradas con turno',
      },
      {
        titulo: 'Horas extra',
        valor: horas(e.total),
        detalle: `Promedio diario: ${horas(m.agregado.tendencia.promedioDiarioHoras)}`,
      },
    ];
    const separacion = 10;
    const ancho = (ANCHO - separacion * 3) / 4;
    const y = doc.y;
    tarjetas.forEach((t, i) => {
      const x = MARGEN + i * (ancho + separacion);
      doc.roundedRect(x, y, ancho, 70, 8).fill(COLOR.terciario);
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(8)
        .text(t.titulo.toUpperCase(), x + 10, y + 10, { width: ancho - 20 });
      doc
        .fillColor(COLOR.primario)
        .font('Helvetica-Bold')
        .fontSize(17)
        .text(t.valor, x + 10, y + 24, { width: ancho - 20 });
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(7.5)
        .text(t.detalle, x + 10, y + 48, { width: ancho - 20 });
    });
    doc.y = y + 88;
  }

  private grafico(doc: Doc, m: MetricasCalculadas) {
    const { barras, mejor, variacionPct } = m.agregado.tendencia;
    this.titulo(
      doc,
      m.tipo === 'SEMANA' ? 'Horas por día' : 'Horas por semana',
      variacionPct === null
        ? 'Sin datos del periodo anterior para comparar'
        : `${variacionPct >= 0 ? '+' : ''}${variacionPct} % frente al periodo anterior`,
    );

    const alto = 120;
    const y0 = doc.y + 14;
    const maximo = Math.max(1, ...barras.map((b) => b.horas));
    const paso = ANCHO / barras.length;
    const anchoBarra = Math.min(46, paso * 0.56);
    const indiceMejor = mejor
      ? barras.findIndex((b) => b.horas === maximo)
      : -1;

    doc
      .moveTo(MARGEN, y0 + alto)
      .lineTo(MARGEN + ANCHO, y0 + alto)
      .lineWidth(0.6)
      .strokeColor(COLOR.borde)
      .stroke();
    barras.forEach((b, i) => {
      const x = MARGEN + i * paso + (paso - anchoBarra) / 2;
      const altoBarra =
        b.horas > 0 ? Math.max(3, (b.horas / maximo) * alto) : 0;
      if (altoBarra > 0) {
        doc
          .roundedRect(x, y0 + alto - altoBarra, anchoBarra, altoBarra, 4)
          .fill(i === indiceMejor ? COLOR.primario : COLOR.primarioSuave);
      }
      doc
        .fillColor(COLOR.texto)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(
          b.horas > 0 ? horas(b.horas) : '—',
          x - 10,
          y0 + alto - altoBarra - 12,
          { width: anchoBarra + 20, align: 'center' },
        );
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(8)
        .text(b.etiqueta, x - 10, y0 + alto + 6, {
          width: anchoBarra + 20,
          align: 'center',
        });
    });
    doc.y = y0 + alto + 24;
    if (mejor) {
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Mayor carga: ${mejor.etiqueta} con ${horas(mejor.horas)}${
            mejor.variacionPct === null
              ? ''
              : ` (${mejor.variacionPct >= 0 ? '+' : ''}${mejor.variacionPct} %)`
          }.`,
          MARGEN,
          doc.y,
        );
    }
    doc.y += 18;
  }

  private tablaColaboradores(doc: Doc, m: MetricasCalculadas) {
    this.titulo(
      doc,
      'Detalle de colaboradores',
      'Ordenado por horas trabajadas. La asistencia y la meta se miden hasta hoy.',
    );
    this.tabla(
      doc,
      [
        { titulo: 'Colaborador', ancho: 110 },
        { titulo: 'Rol', ancho: 70 },
        { titulo: 'Turno', ancho: 90 },
        { titulo: 'Días', ancho: 30, alinear: 'right' },
        { titulo: 'Asist.', ancho: 42, alinear: 'right' },
        { titulo: 'Puntual.', ancho: 46, alinear: 'right' },
        { titulo: 'Horas', ancho: 44, alinear: 'right' },
        { titulo: 'Extra', ancho: 38, alinear: 'right' },
        { titulo: 'Meta', ancho: ANCHO - 470, alinear: 'center' },
      ],
      (m.colaboradores ?? []).map((c) => [
        c.nombre,
        NOMBRE_ROL[c.rol],
        c.turno ?? 'Sin turno',
        String(c.diasTrabajados),
        pct(c.asistenciaPct),
        pct(c.puntualidadPct),
        horas(c.horas),
        horas(c.horasExtra),
        c.metaAlcanzada ? 'Sí' : '—',
      ]),
      'No hay colaboradores activos en la organización.',
    );
  }

  private tablaRegistro(doc: Doc, m: MetricasCalculadas) {
    const zona = m.organizacion.zonaHoraria;
    this.titulo(
      doc,
      'Registro diario',
      m.tareas
        ? `Tareas del periodo: ${m.tareas.completadas} de ${m.tareas.total} completadas.`
        : '',
    );
    this.tabla(
      doc,
      [
        { titulo: 'Día', ancho: 70 },
        { titulo: 'Entrada', ancho: 58, alinear: 'center' },
        { titulo: 'Salida', ancho: 58, alinear: 'center' },
        { titulo: 'Horas', ancho: 56, alinear: 'right' },
        { titulo: 'Estado', ancho: 120 },
        { titulo: 'Extra', ancho: 56, alinear: 'right' },
        { titulo: 'Marcas QR', ancho: ANCHO - 418, alinear: 'right' },
      ],
      [...(m.registroDiario ?? [])]
        .reverse()
        .map((d) => [
          diaConFecha(d.fecha),
          horaLocal(d.entrada, zona),
          horaLocal(d.salida, zona),
          d.entrada ? horas(d.horas) : '—',
          estadoDelDia(d),
          d.horasExtra > 0 ? horas(d.horasExtra) : '—',
          String(d.marcas),
        ]),
      'El periodo aún no tiene días transcurridos.',
    );
  }

  private anexoMarcas(doc: Doc, m: MetricasCalculadas) {
    const zona = m.organizacion.zonaHoraria;
    doc.addPage();
    this.titulo(
      doc,
      'Anexo · Marcas de QR',
      'Cada lectura del código QR de asistencia registrada en el periodo.',
    );
    const individual = m.alcance === 'MIEMBRO';
    this.tabla(
      doc,
      [
        ...(individual ? [] : [{ titulo: 'Colaborador', ancho: 180 }]),
        { titulo: 'Día', ancho: 110 },
        { titulo: 'Hora', ancho: 80, alinear: 'center' as const },
        { titulo: 'Tipo', ancho: individual ? ANCHO - 190 : ANCHO - 370 },
      ],
      m.marcas.map((marca) => [
        ...(individual ? [] : [marca.nombre]),
        diaConFecha(marca.fecha),
        horaLocal(marca.hora, zona),
        marca.tipo === 'ENTRADA' ? 'Entrada' : 'Salida',
      ]),
      'No hubo marcas de QR en el periodo.',
    );
  }

  private titulo(doc: Doc, texto: string, detalle: string) {
    if (doc.y > LIMITE_Y - 90) doc.addPage();
    doc
      .fillColor(COLOR.texto)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(texto, MARGEN, doc.y);
    if (detalle) {
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(8)
        .text(detalle, MARGEN, doc.y + 2);
    }
    doc.y += 8;
  }

  /** Tabla con encabezado repetido en cada página y filas alternadas. */
  private tabla(
    doc: Doc,
    columnas: Columna[],
    filas: string[][],
    vacio: string,
  ) {
    const altoFila = 20;
    const encabezado = () => {
      const y = doc.y;
      doc.rect(MARGEN, y, ANCHO, altoFila).fill(COLOR.primario);
      let x = MARGEN;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
      for (const c of columnas) {
        doc.text(c.titulo, x + 6, y + 6, {
          width: c.ancho - 12,
          align: c.alinear ?? 'left',
          lineBreak: false,
        });
        x += c.ancho;
      }
      doc.y = y + altoFila;
    };

    encabezado();
    if (filas.length === 0) {
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(9)
        .text(vacio, MARGEN + 6, doc.y + 8);
      doc.y += 16;
      return;
    }
    filas.forEach((fila, i) => {
      // Cada fila crece hasta dos líneas si un texto no cabe (p. ej. un turno de nombre largo).
      doc.font('Helvetica').fontSize(8);
      const lineas = Math.max(
        ...fila.map((celda, j) =>
          Math.round(
            doc.heightOfString(celda, { width: columnas[j].ancho - 12 }) /
              doc.currentLineHeight(true),
          ),
        ),
      );
      const alto = altoFila + (Math.min(lineas, 2) - 1) * ALTO_LINEA;
      if (doc.y + alto > LIMITE_Y) {
        doc.addPage();
        encabezado();
      }
      const y = doc.y;
      if (i % 2 === 1) doc.rect(MARGEN, y, ANCHO, alto).fill(COLOR.fondoFila);
      let x = MARGEN;
      doc.font('Helvetica').fontSize(8).fillColor(COLOR.texto);
      fila.forEach((celda, j) => {
        const c = columnas[j];
        doc.text(celda, x + 6, y + 6, {
          width: c.ancho - 12,
          height: ALTO_LINEA * 2,
          align: c.alinear ?? 'left',
          ellipsis: true,
        });
        x += c.ancho;
      });
      doc.y = y + alto;
    });
    doc
      .moveTo(MARGEN, doc.y)
      .lineTo(MARGEN + ANCHO, doc.y)
      .lineWidth(0.6)
      .strokeColor(COLOR.borde)
      .stroke();
    doc.y += 18;
  }

  private pies(doc: Doc, m: MetricasCalculadas) {
    const { start, count } = doc.bufferedPageRange();
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i);
      // El pie va dentro del margen inferior: sin esto, pdfkit abriría otra página.
      doc.page.margins.bottom = 0;
      const y = doc.page.height - MARGEN + 6;
      doc
        .moveTo(MARGEN, y - 8)
        .lineTo(MARGEN + ANCHO, y - 8)
        .lineWidth(0.5)
        .strokeColor(COLOR.borde)
        .stroke();
      doc
        .fillColor(COLOR.apagado)
        .font('Helvetica')
        .fontSize(7.5)
        .text(`Generado por Planix · ${m.organizacion.nombre}`, MARGEN, y, {
          width: ANCHO / 2,
          lineBreak: false,
        })
        .text(`Página ${i - start + 1} de ${count}`, MARGEN + ANCHO / 2, y, {
          width: ANCHO / 2,
          align: 'right',
          lineBreak: false,
        });
    }
  }
}
