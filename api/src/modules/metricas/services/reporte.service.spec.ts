import ExcelJS from 'exceljs';
import type { MetricasCalculadas } from '../interfaces/metricas.interface';
import {
  agregarPeriodo,
  rangoDelPeriodo,
  registroDiario,
  resumenColaborador,
  type MiembroCalculo,
} from '../utils/metricas.util';
import { nombreArchivo } from '../utils/formato-reporte.util';
import { ReporteExcelService } from './reporte-excel.service';
import { ReportePdfService } from './reporte-pdf.service';

const HOY = '2026-10-15';

/** El `Buffer` de Node con el tipo que pide exceljs. */
const aBuffer = (archivo: Buffer) => archivo as unknown as ExcelJS.Buffer;
const reloj = {
  ahora: () => new Date('2026-10-15T21:00:00Z'),
};

const sofia: MiembroCalculo = {
  miembroId: 'm1',
  nombre: 'Sofía Delgado',
  email: 'sofia@planix.test',
  avatarUrl: null,
  rol: 'EMPLEADO',
  turno: 'Turno Mañana',
  plantilla: { dias: [1, 2, 3, 4, 5], duracionMin: 540 },
  jornadas: [
    {
      fecha: '2026-10-12',
      minutos: 600,
      puntual: true,
      minutosTarde: 0,
      turnoMin: 540,
      entrada: new Date('2026-10-12T13:00:00Z'),
      salida: new Date('2026-10-12T23:00:00Z'),
      escaneos: [
        { tipo: 'ENTRADA', hora: new Date('2026-10-12T13:00:00Z') },
        { tipo: 'SALIDA', hora: new Date('2026-10-12T23:00:00Z') },
      ],
    },
  ],
};

function datos(individual: boolean): MetricasCalculadas {
  const rango = rangoDelPeriodo('SEMANA', HOY);
  return {
    organizacion: {
      id: 'o1',
      nombre: 'Clínica Ñandú',
      zonaHoraria: 'America/Lima',
    },
    hoy: HOY,
    tipo: 'SEMANA',
    rango,
    alcance: individual ? 'MIEMBRO' : 'EQUIPO',
    miembro: individual
      ? {
          miembroId: 'm1',
          nombre: sofia.nombre,
          avatarUrl: null,
          rol: 'EMPLEADO',
          turno: sofia.turno,
        }
      : null,
    miembrosActivos: 1,
    agregado: agregarPeriodo([sofia], 'SEMANA', rango, HOY),
    colaboradores: individual ? null : [resumenColaborador(sofia, rango, HOY)],
    registroDiario: individual ? registroDiario(sofia, rango, HOY) : null,
    tareas: individual ? { completadas: 1, total: 2 } : null,
    marcas: [
      {
        nombre: sofia.nombre,
        fecha: '2026-10-12',
        hora: new Date('2026-10-12T13:00:00Z'),
        tipo: 'ENTRADA',
      },
      {
        nombre: sofia.nombre,
        fecha: '2026-10-12',
        hora: new Date('2026-10-12T23:00:00Z'),
        tipo: 'SALIDA',
      },
    ],
  };
}

describe('reporte exportable', () => {
  it('genera un PDF del equipo y uno individual', async () => {
    const pdf = new ReportePdfService(reloj);
    for (const individual of [false, true]) {
      const archivo = await pdf.generar(datos(individual));
      expect(archivo.subarray(0, 5).toString()).toBe('%PDF-');
      expect(archivo.length).toBeGreaterThan(2000);
    }
  });

  it('genera un Excel con sus hojas y valores numéricos', async () => {
    const excel = new ReporteExcelService(reloj);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(aBuffer(await excel.generar(datos(false))));
    expect(libro.worksheets.map((h) => h.name)).toEqual([
      'Resumen',
      'Colaboradores',
      'Marcas QR',
    ]);
    const fila = libro.getWorksheet('Colaboradores')!.getRow(2);
    expect(fila.getCell(1).value).toBe('Sofía Delgado');
    expect(fila.getCell(8).value).toBe(10);
    expect(libro.getWorksheet('Marcas QR')!.rowCount).toBe(3);

    const individual = new ExcelJS.Workbook();
    await individual.xlsx.load(aBuffer(await excel.generar(datos(true))));
    expect(individual.worksheets.map((h) => h.name)).toEqual([
      'Resumen',
      'Registro diario',
      'Marcas QR',
    ]);
  });

  it('nombra el archivo según el alcance y el periodo', () => {
    expect(nombreArchivo(datos(false), 'pdf')).toBe(
      'planix-reporte-clinica-nandu-2026-10-12_2026-10-18.pdf',
    );
    expect(nombreArchivo(datos(true), 'xlsx')).toBe(
      'planix-reporte-sofia-delgado-2026-10-12_2026-10-18.xlsx',
    );
  });
});
