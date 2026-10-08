import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EquipoQueryDto } from './equipo-query.dto';

const convertir = (plano: object) => plainToInstance(EquipoQueryDto, plano);

describe('EquipoQueryDto', () => {
  it('aplica los valores por defecto', async () => {
    const dto = convertir({});
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ filtro: 'TODOS', page: 1, pageSize: 20 });
  });

  it('convierte los números que llegan como texto en la URL', async () => {
    const dto = convertir({
      q: '  sofia ',
      filtro: 'ADMIN',
      page: '2',
      pageSize: '4',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      q: 'sofia',
      filtro: 'ADMIN',
      page: 2,
      pageSize: 4,
    });
  });

  it('rechaza valores fuera de rango o desconocidos', async () => {
    for (const plano of [
      { page: '0' },
      { page: 'abc' },
      { pageSize: '101' },
      { pageSize: '0' },
      { filtro: 'NOPE' },
    ]) {
      expect((await validate(convertir(plano))).length).toBeGreaterThan(0);
    }
  });
});
