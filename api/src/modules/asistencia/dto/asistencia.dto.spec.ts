import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HistorialQueryDto } from './historial-query.dto';
import { OrganizacionAsistenciaDto } from './organizacion-asistencia.dto';
import { RegistrarEntradaDto } from './registrar-entrada.dto';

const ORG = '3f2a8c1e-5b7d-4e9f-a1c2-0d4e6f8a9b10';

describe('RegistrarEntradaDto', () => {
  it('recorta el token y exige que no esté vacío', async () => {
    const dto = plainToInstance(RegistrarEntradaDto, { token: '  PLX1.abc  ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.token).toBe('PLX1.abc');

    for (const token of ['   ', '', 123, 'x'.repeat(201)]) {
      expect(
        (await validate(plainToInstance(RegistrarEntradaDto, { token })))
          .length,
      ).toBeGreaterThan(0);
    }
  });
});

describe('OrganizacionAsistenciaDto', () => {
  it('exige un UUID', async () => {
    expect(
      await validate(
        plainToInstance(OrganizacionAsistenciaDto, { organizacionId: ORG }),
      ),
    ).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(OrganizacionAsistenciaDto, { organizacionId: 'x' }),
        )
      ).length,
    ).toBe(1);
  });
});

describe('HistorialQueryDto', () => {
  it('aplica la paginación por defecto y convierte números', async () => {
    const dto = plainToInstance(HistorialQueryDto, {
      organizacionId: ORG,
      page: '2',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, pageSize: 20 });
  });

  it('valida que las fechas existan', async () => {
    const ok = plainToInstance(HistorialQueryDto, {
      organizacionId: ORG,
      desde: '2026-02-28',
      hasta: '2026-10-09',
    });
    expect(await validate(ok)).toHaveLength(0);
    for (const desde of ['2026-02-30', '09/10/2026', '2026-1-1']) {
      expect(
        (
          await validate(
            plainToInstance(HistorialQueryDto, { organizacionId: ORG, desde }),
          )
        ).length,
      ).toBe(1);
    }
  });
});
