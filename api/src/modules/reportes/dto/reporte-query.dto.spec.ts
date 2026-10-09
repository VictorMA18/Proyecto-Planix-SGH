import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReporteQueryDto } from './reporte-query.dto';

const errores = async (plano: object) =>
  (await validate(plainToInstance(ReporteQueryDto, plano))).map(
    (e) => e.property,
  );

describe('ReporteQueryDto', () => {
  it('acepta un rango válido, incluido un solo día y el máximo de 92 días', async () => {
    expect(await errores({ desde: '2026-10-05', hasta: '2026-10-11' })).toEqual(
      [],
    );
    expect(await errores({ desde: '2026-10-09', hasta: '2026-10-09' })).toEqual(
      [],
    );
    expect(await errores({ desde: '2026-07-01', hasta: '2026-09-30' })).toEqual(
      [],
    );
  });

  it('rechaza un rango invertido o demasiado largo', async () => {
    expect(await errores({ desde: '2026-10-11', hasta: '2026-10-05' })).toEqual(
      ['hasta'],
    );
    expect(await errores({ desde: '2026-07-01', hasta: '2026-10-01' })).toEqual(
      ['hasta'],
    );
  });

  it('exige ambas fechas válidas y un miembro con UUID', async () => {
    expect(await errores({ desde: '2026-10-05' })).toEqual(['hasta']);
    expect(await errores({ desde: '2026-13-01', hasta: '2026-10-05' })).toEqual(
      ['desde'],
    );
    expect(
      await errores({
        desde: '2026-10-05',
        hasta: '2026-10-06',
        miembroId: 'x',
      }),
    ).toEqual(['miembroId']);
  });
});
