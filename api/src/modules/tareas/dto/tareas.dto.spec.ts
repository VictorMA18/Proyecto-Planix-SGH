import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CambiarEstadoDto,
  CrearComentarioDto,
  MarcarSubtareaDto,
} from './acciones-tarea.dto';
import { CrearTareaDto } from './crear-tarea.dto';
import { TareasQueryDto } from './tareas-query.dto';

const M1 = '3f2a8c1e-5b7d-4e9f-a1c2-0d4e6f8a9b10';
const valida = {
  titulo: '  Inspección de accesos ',
  fechaInicio: '2026-10-12T14:00:00.000Z',
  fechaFin: '2026-10-12T16:00:00.000Z',
  miembroIds: [M1],
  etiquetas: [' Seguridad ', 'Diseño'],
  subtareas: [{ titulo: ' Revisar torniquetes ', completada: false }],
};

const errores = async (plano: object) =>
  (await validate(plainToInstance(CrearTareaDto, plano))).map(
    (e) => e.property,
  );

describe('CrearTareaDto', () => {
  it('acepta una tarea válida, aplica valores por defecto y recorta textos', async () => {
    const dto = plainToInstance(CrearTareaDto, valida);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      titulo: 'Inspección de accesos',
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      etiquetas: ['Seguridad', 'Diseño'],
    });
    expect(dto.subtareas[0].titulo).toBe('Revisar torniquetes');
  });

  it('admite fin nulo y sin subtareas', async () => {
    expect(
      await errores({ ...valida, fechaFin: null, subtareas: undefined }),
    ).toEqual([]);
  });

  it('rechaza títulos cortos, fechas inválidas y fin anterior al inicio', async () => {
    expect(await errores({ ...valida, titulo: 'ab' })).toEqual(['titulo']);
    expect(await errores({ ...valida, fechaInicio: '12/10/2026' })).toEqual([
      'fechaInicio',
    ]);
    expect(
      await errores({ ...valida, fechaFin: '2026-10-12T13:00:00.000Z' }),
    ).toEqual(['fechaFin']);
  });

  it('valida personas, etiquetas, estado, prioridad y subtareas anidadas', async () => {
    expect(await errores({ ...valida, miembroIds: [] })).toEqual([
      'miembroIds',
    ]);
    expect(await errores({ ...valida, miembroIds: ['x'] })).toEqual([
      'miembroIds',
    ]);
    expect(
      await errores({ ...valida, etiquetas: ['a', 'b', 'c', 'd', 'e', 'f'] }),
    ).toEqual(['etiquetas']);
    expect(await errores({ ...valida, etiquetas: ['x'.repeat(25)] })).toEqual([
      'etiquetas',
    ]);
    expect(await errores({ ...valida, etiquetas: ['A', 'A'] })).toEqual([
      'etiquetas',
    ]);
    expect(await errores({ ...valida, estado: 'VISTA' })).toEqual(['estado']);
    expect(await errores({ ...valida, prioridad: 'URGENTE' })).toEqual([
      'prioridad',
    ]);
    expect(
      await errores({
        ...valida,
        subtareas: [{ titulo: '', completada: false }],
      }),
    ).toEqual(['subtareas']);
    expect(
      await errores({
        ...valida,
        subtareas: [{ titulo: 'Paso', completada: 'sí' }],
      }),
    ).toEqual(['subtareas']);
  });
});

describe('TareasQueryDto', () => {
  const errores = async (plano: object) =>
    (await validate(plainToInstance(TareasQueryDto, plano))).map(
      (e) => e.property,
    );

  it('acepta un mes visible del calendario y un miembro opcional', async () => {
    expect(await errores({ desde: '2026-09-28', hasta: '2026-11-08' })).toEqual(
      [],
    );
    expect(
      await errores({
        desde: '2026-09-28',
        hasta: '2026-11-08',
        miembroId: M1,
      }),
    ).toEqual([]);
  });

  it('rechaza rangos invertidos o de más de 62 días', async () => {
    expect(await errores({ desde: '2026-10-10', hasta: '2026-10-01' })).toEqual(
      ['hasta'],
    );
    expect(await errores({ desde: '2026-01-01', hasta: '2026-03-15' })).toEqual(
      ['hasta'],
    );
    expect(
      await errores({
        desde: '2026-10-01',
        hasta: '2026-10-05',
        miembroId: 'x',
      }),
    ).toEqual(['miembroId']);
  });
});

describe('DTOs de acciones', () => {
  it('estado, subtarea y comentario', async () => {
    expect(
      await validate(plainToInstance(CambiarEstadoDto, { estado: 'REVISION' })),
    ).toHaveLength(0);
    expect(
      (await validate(plainToInstance(CambiarEstadoDto, { estado: 'VISTA' })))
        .length,
    ).toBe(1);
    expect(
      await validate(plainToInstance(MarcarSubtareaDto, { completada: true })),
    ).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(MarcarSubtareaDto, { completada: 'true' }),
        )
      ).length,
    ).toBe(1);

    const comentario = plainToInstance(CrearComentarioDto, {
      texto: '  Listo  ',
    });
    expect(await validate(comentario)).toHaveLength(0);
    expect(comentario.texto).toBe('Listo');
    for (const texto of ['   ', 'x'.repeat(1001)]) {
      expect(
        (await validate(plainToInstance(CrearComentarioDto, { texto }))).length,
      ).toBe(1);
    }
  });
});
