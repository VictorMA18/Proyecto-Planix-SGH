import {
  desdeParaMetricas,
  diasDeTurnoEnElMes,
  metricasDelMes,
  ultimoDiaDelMes,
} from './resumen-miembro.util';

describe('resumen del miembro', () => {
  it('calcula el último día y los días de turno del mes', () => {
    expect(ultimoDiaDelMes('2026-02-10')).toBe('2026-02-28');
    expect(ultimoDiaDelMes('2026-12-31')).toBe('2026-12-31');
    // Octubre de 2026 tiene 22 días de lunes a viernes.
    expect(diasDeTurnoEnElMes('2026-10-12', [1, 2, 3, 4, 5])).toBe(22);
  });

  it('lee desde el lunes de la semana pasada si cae en el mes anterior', () => {
    expect(desdeParaMetricas('2026-10-02')).toBe('2026-09-21');
    expect(desdeParaMetricas('2026-10-21')).toBe('2026-10-01');
  });

  it('puntualidad, horas, meta y variación semanal', () => {
    // Miércoles 14 de octubre de 2026.
    const metricas = metricasDelMes(
      '2026-10-14',
      [
        // Semana pasada (lun 5 – mié 7) y su jueves (no cuenta para la comparación).
        { fecha: '2026-10-05', puntual: true, minutosTrabajados: 480 },
        { fecha: '2026-10-08', puntual: false, minutosTrabajados: 480 },
        // Esta semana (lun 12 – mié 14).
        { fecha: '2026-10-12', puntual: true, minutosTrabajados: 540 },
        { fecha: '2026-10-13', puntual: null, minutosTrabajados: 120 },
        // Mes anterior: no cuenta para el mes.
        { fecha: '2026-09-30', puntual: false, minutosTrabajados: 600 },
      ],
      { dias: [1, 2, 3, 4, 5], objetivoMin: 540 },
    );
    expect(metricas).toEqual({
      periodo: '2026-10',
      puntualidad: 66.7,
      horas: {
        trabajadas: 27, // 480 + 480 + 540 + 120 minutos
        meta: 198, // 22 días × 9 h
        variacionSemana: 3, // (540 + 120) − 480 minutos
      },
    });
  });

  it('sin turno ni jornadas evaluadas', () => {
    expect(metricasDelMes('2026-10-14', [], null)).toEqual({
      periodo: '2026-10',
      puntualidad: null,
      horas: { trabajadas: 0, meta: 0, variacionSemana: 0 },
    });
  });
});
