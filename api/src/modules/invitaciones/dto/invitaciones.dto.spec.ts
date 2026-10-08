import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearCodigoInvitacionDto } from './crear-codigo-invitacion.dto';
import { CrearInvitacionDto } from './crear-invitacion.dto';
import { TokenParamDto } from './token-param.dto';

describe('DTO de invitaciones', () => {
  describe('CrearInvitacionDto', () => {
    it('normaliza el correo (espacios y mayúsculas) y acepta los roles invitables', async () => {
      const dto = plainToInstance(CrearInvitacionDto, {
        email: '  Ana@Acme.CORP ',
        rol: 'SUPERVISOR',
      });
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.email).toBe('ana@acme.corp');
    });

    it('rechaza correos inválidos y el rol SUPER_ADMIN', async () => {
      expect(
        await validate(
          plainToInstance(CrearInvitacionDto, {
            email: 'no-es-correo',
            rol: 'EMPLEADO',
          }),
        ),
      ).toHaveLength(1);
      expect(
        await validate(
          plainToInstance(CrearInvitacionDto, {
            email: 'a@b.co',
            rol: 'SUPER_ADMIN',
          }),
        ),
      ).toHaveLength(1);
    });
  });

  describe('CrearCodigoInvitacionDto', () => {
    const validar = (plano: object) =>
      validate(plainToInstance(CrearCodigoInvitacionDto, plano));

    it('solo permite vigencias de 5, 10 o 15 minutos', async () => {
      for (const vigenciaMinutos of [5, 10, 15]) {
        expect(
          await validar({ rol: 'EMPLEADO', vigenciaMinutos }),
        ).toHaveLength(0);
      }
      for (const vigenciaMinutos of [0, 7, 30, '10', undefined]) {
        expect(
          await validar({ rol: 'EMPLEADO', vigenciaMinutos }),
        ).toHaveLength(1);
      }
    });
  });

  describe('TokenParamDto', () => {
    it('recorta espacios y exige entre 4 y 64 caracteres', async () => {
      const dto = plainToInstance(TokenParamDto, { token: '  ABCD1234  ' });
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.token).toBe('ABCD1234');
      expect(
        await validate(plainToInstance(TokenParamDto, { token: 'ab' })),
      ).toHaveLength(1);
    });
  });
});
