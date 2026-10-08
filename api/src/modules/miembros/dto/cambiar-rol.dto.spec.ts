import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CambiarRolDto } from './cambiar-rol.dto';
import { MiembroIdParamDto } from './miembro-id-param.dto';

describe('DTO de miembros', () => {
  it('CambiarRolDto acepta los roles asignables y rechaza SUPER_ADMIN u otros valores', async () => {
    for (const rol of ['ADMIN', 'SUPERVISOR', 'EMPLEADO']) {
      expect(
        await validate(plainToInstance(CambiarRolDto, { rol })),
      ).toHaveLength(0);
    }
    for (const rol of ['SUPER_ADMIN', 'admin', '', undefined]) {
      expect(
        await validate(plainToInstance(CambiarRolDto, { rol })),
      ).toHaveLength(1);
    }
  });

  it('MiembroIdParamDto exige dos UUID', async () => {
    const uuid = '00000000-0000-4000-8000-000000000000';
    expect(
      await validate(
        plainToInstance(MiembroIdParamDto, {
          organizacionId: uuid,
          miembroId: uuid,
        }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(MiembroIdParamDto, {
          organizacionId: uuid,
          miembroId: 'x',
        }),
      ),
    ).toHaveLength(1);
  });
});
