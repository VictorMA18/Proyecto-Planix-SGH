import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ColaboradoresQueryDto,
  MetricasQueryDto,
  ReporteMetricasQueryDto,
} from './metricas-query.dto';

const UUID = '9b2f7c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b';

async function errores<T extends object>(
  clase: new () => T,
  plano: object,
): Promise<string[]> {
  return (await validate(plainToInstance(clase, plano))).map((e) => e.property);
}

describe('DTOs de métricas', () => {
  it('MetricasQueryDto exige periodo y fecha reales; miembroId es opcional', async () => {
    expect(
      await errores(MetricasQueryDto, {
        periodo: 'SEMANA',
        fecha: '2026-10-15',
      }),
    ).toEqual([]);
    expect(
      await errores(MetricasQueryDto, {
        periodo: 'MES',
        fecha: '2026-10-15',
        miembroId: UUID,
      }),
    ).toEqual([]);
    expect(await errores(MetricasQueryDto, {})).toEqual(['periodo', 'fecha']);
    expect(
      await errores(MetricasQueryDto, {
        periodo: 'DIA',
        fecha: '2026-02-30',
        miembroId: 'abc',
      }),
    ).toEqual(['miembroId', 'periodo', 'fecha']);
  });

  it('ColaboradoresQueryDto: valores por defecto, conversión y límites', async () => {
    const dto = plainToInstance(ColaboradoresQueryDto, {
      periodo: 'SEMANA',
      fecha: '2026-10-15',
      q: '  ana ',
      page: '2',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ q: 'ana', page: 2, pageSize: 10 });

    for (const extra of [
      { page: '0' },
      { pageSize: '51' },
      { pageSize: 'x' },
    ]) {
      expect(
        await errores(ColaboradoresQueryDto, {
          periodo: 'SEMANA',
          fecha: '2026-10-15',
          ...extra,
        }),
      ).toHaveLength(1);
    }
  });

  it('ReporteMetricasQueryDto acepta solo PDF o XLSX', async () => {
    const base = { periodo: 'MES', fecha: '2026-10-15' };
    expect(
      await errores(ReporteMetricasQueryDto, { ...base, formato: 'PDF' }),
    ).toEqual([]);
    expect(
      await errores(ReporteMetricasQueryDto, { ...base, formato: 'XLSX' }),
    ).toEqual([]);
    expect(
      await errores(ReporteMetricasQueryDto, { ...base, formato: 'CSV' }),
    ).toEqual(['formato']);
    expect(await errores(ReporteMetricasQueryDto, base)).toEqual(['formato']);
  });
});
