import {
  diaSemana,
  diasEntre,
  fechaLocal,
  instanteLocal,
  lunesDe,
  minutosLocales,
  sumarDias,
} from './zona-horaria.util';

describe('zona-horaria.util', () => {
  it('usa la fecha de la organización, no la de UTC', () => {
    // 2026-10-09 03:30 UTC es todavía el 8 de octubre a las 22:30 en Lima (UTC-5).
    const instante = new Date('2026-10-09T03:30:00Z');
    expect(fechaLocal(instante, 'America/Lima')).toBe('2026-10-08');
    expect(minutosLocales(instante, 'America/Lima')).toBe(22 * 60 + 30);
    expect(fechaLocal(instante, 'UTC')).toBe('2026-10-09');
  });

  it('convierte una hora local a su instante UTC', () => {
    expect(
      instanteLocal('2026-10-09', 8 * 60, 'America/Lima').toISOString(),
    ).toBe('2026-10-09T13:00:00.000Z');
    expect(instanteLocal('2026-10-09', 0, 'UTC').toISOString()).toBe(
      '2026-10-09T00:00:00.000Z',
    );
  });

  it('respeta el horario de verano', () => {
    // Madrid: UTC+2 en julio y UTC+1 en diciembre.
    expect(
      instanteLocal('2026-07-01', 9 * 60, 'Europe/Madrid').toISOString(),
    ).toBe('2026-07-01T07:00:00.000Z');
    expect(
      instanteLocal('2026-12-01', 9 * 60, 'Europe/Madrid').toISOString(),
    ).toBe('2026-12-01T08:00:00.000Z');
  });

  it('calcula días de la semana y desplazamientos de fecha', () => {
    expect(diaSemana('2026-10-05')).toBe(1); // lunes
    expect(diaSemana('2026-10-11')).toBe(7); // domingo
    expect(lunesDe('2026-10-11')).toBe('2026-10-05');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diasEntre('2026-10-01', '2026-10-31')).toBe(30);
  });
});
