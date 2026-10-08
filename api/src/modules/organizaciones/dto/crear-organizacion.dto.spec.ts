import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearOrganizacionDto } from './crear-organizacion.dto';

const validar = (plano: object) =>
  validate(plainToInstance(CrearOrganizacionDto, plano), { whitelist: true });

describe('CrearOrganizacionDto', () => {
  it('acepta un nombre válido y usa America/Lima por defecto', async () => {
    const dto = plainToInstance(CrearOrganizacionDto, {
      nombre: '  Acme Corp  ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.nombre).toBe('Acme Corp');
    expect(dto.zonaHoraria).toBe('America/Lima');
  });

  it('rechaza nombres vacíos o demasiado largos', async () => {
    expect(await validar({ nombre: '   ' })).toHaveLength(1);
    expect(await validar({ nombre: 'A' })).toHaveLength(1);
    expect(await validar({ nombre: 'x'.repeat(151) })).toHaveLength(1);
    expect(await validar({})).toHaveLength(1);
  });

  it('valida la zona horaria', async () => {
    expect(
      await validar({ nombre: 'Acme', zonaHoraria: 'America/Bogota' }),
    ).toHaveLength(0);
    const [error] = await validar({
      nombre: 'Acme',
      zonaHoraria: 'Marte/Olimpo',
    });
    expect(Object.values(error.constraints ?? {})).toContain(
      'La zona horaria no es válida.',
    );
  });
});
