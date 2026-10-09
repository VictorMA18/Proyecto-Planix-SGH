import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PlantillaTurnoDto } from './plantilla-turno.dto';
import { ToleranciaDto } from './tolerancia.dto';

const valida = {
  nombre: '  Turno Mañana ',
  horaInicio: '07:00',
  horaFin: '15:30',
  dias: [1, 2, 3, 4, 5],
  miembroIds: ['3f2a8c1e-5b7d-4e9f-a1c2-0d4e6f8a9b10'],
};

const errores = async (plano: object) =>
  (await validate(plainToInstance(PlantillaTurnoDto, plano))).map(
    (e) => e.property,
  );

describe('PlantillaTurnoDto', () => {
  it('acepta una plantilla válida y recorta el nombre', async () => {
    const dto = plainToInstance(PlantillaTurnoDto, valida);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.nombre).toBe('Turno Mañana');
  });

  it('acepta un turno que cruza la medianoche y una lista de miembros vacía', async () => {
    expect(
      await errores({
        ...valida,
        horaInicio: '22:00',
        horaFin: '06:00',
        miembroIds: [],
      }),
    ).toEqual([]);
  });

  it('rechaza horas mal escritas', async () => {
    for (const hora of ['7:00', '24:00', '07:60', '0700', '']) {
      expect(await errores({ ...valida, horaInicio: hora })).toEqual([
        'horaInicio',
      ]);
    }
  });

  it('rechaza días vacíos, repetidos o fuera de rango', async () => {
    for (const dias of [[], [1, 1], [0], [8], [1.5]]) {
      expect(await errores({ ...valida, dias })).toEqual(['dias']);
    }
  });

  it('rechaza nombres cortos y miembros inválidos', async () => {
    expect(await errores({ ...valida, nombre: ' A ' })).toEqual(['nombre']);
    expect(await errores({ ...valida, miembroIds: ['no-es-uuid'] })).toEqual([
      'miembroIds',
    ]);
    expect(await errores({ ...valida, miembroIds: undefined })).toEqual([
      'miembroIds',
    ]);
  });
});

describe('ToleranciaDto', () => {
  it('acepta de 0 a 120 minutos enteros', async () => {
    for (const toleranciaMin of [0, 15, 120]) {
      expect(
        await validate(plainToInstance(ToleranciaDto, { toleranciaMin })),
      ).toHaveLength(0);
    }
    for (const toleranciaMin of [-1, 121, 2.5, '10']) {
      expect(
        (await validate(plainToInstance(ToleranciaDto, { toleranciaMin })))
          .length,
      ).toBeGreaterThan(0);
    }
  });
});
