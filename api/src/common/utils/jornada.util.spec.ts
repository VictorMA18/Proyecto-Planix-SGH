import {
  evaluarPuntualidad,
  minutosTrabajados,
  porcentaje,
  turnoDelDia,
} from './jornada.util';

const h = (iso: string) => new Date(`2026-10-09T${iso}:00Z`);

describe('jornada.util', () => {
  describe('minutosTrabajados', () => {
    it('suma los tramos cerrados', () => {
      const movimientos = [
        { tipo: 'ENTRADA' as const, hora: h('08:00') },
        { tipo: 'SALIDA' as const, hora: h('12:00') },
        { tipo: 'ENTRADA' as const, hora: h('13:00') },
        { tipo: 'SALIDA' as const, hora: h('17:30') },
      ];
      expect(minutosTrabajados(movimientos, h('20:00'))).toBe(8 * 60 + 30);
    });

    it('cuenta el tramo abierto hasta ahora y ordena los movimientos', () => {
      const movimientos = [
        { tipo: 'ENTRADA' as const, hora: h('13:00') },
        { tipo: 'SALIDA' as const, hora: h('12:00') },
        { tipo: 'ENTRADA' as const, hora: h('08:00') },
      ];
      expect(minutosTrabajados(movimientos, h('14:15'))).toBe(4 * 60 + 75);
    });

    it('ignora una salida sin entrada previa', () => {
      expect(
        minutosTrabajados([{ tipo: 'SALIDA', hora: h('09:00') }], h('10:00')),
      ).toBe(0);
    });
  });

  describe('turnoDelDia', () => {
    const manana = {
      nombre: 'Mañana',
      inicioMin: 8 * 60,
      finMin: 17 * 60,
      dias: [1, 2, 3, 4, 5],
    };

    it('devuelve inicio y fin en la zona de la organización', () => {
      const turno = turnoDelDia(manana, '2026-10-09', 'America/Lima'); // viernes
      expect(turno).toMatchObject({ nombre: 'Mañana', objetivoMin: 9 * 60 });
      expect(turno!.inicio.toISOString()).toBe('2026-10-09T13:00:00.000Z');
      expect(turno!.fin.toISOString()).toBe('2026-10-09T22:00:00.000Z');
    });

    it('es null los días que no aplica', () => {
      expect(turnoDelDia(manana, '2026-10-10', 'America/Lima')).toBeNull(); // sábado
    });

    it('cruza la medianoche cuando el fin es menor que el inicio', () => {
      const noche = {
        nombre: 'Noche',
        inicioMin: 22 * 60,
        finMin: 6 * 60,
        dias: [5],
      };
      const turno = turnoDelDia(noche, '2026-10-09', 'UTC');
      expect(turno!.objetivoMin).toBe(8 * 60);
      expect(turno!.fin.toISOString()).toBe('2026-10-10T06:00:00.000Z');
    });
  });

  describe('evaluarPuntualidad', () => {
    const inicio = h('08:00');

    it('es puntual antes del inicio y justo en el límite de la tolerancia', () => {
      expect(evaluarPuntualidad(h('07:50'), inicio, 15)).toEqual({
        minutosTarde: 0,
        puntual: true,
      });
      expect(evaluarPuntualidad(h('08:15'), inicio, 15)).toEqual({
        minutosTarde: 15,
        puntual: true,
      });
    });

    it('llega tarde al pasar la tolerancia', () => {
      expect(evaluarPuntualidad(h('08:16'), inicio, 15)).toEqual({
        minutosTarde: 16,
        puntual: false,
      });
      expect(evaluarPuntualidad(h('08:01'), inicio, 0)).toEqual({
        minutosTarde: 1,
        puntual: false,
      });
    });
  });

  it('porcentaje redondea a un decimal y es null sin base', () => {
    expect(porcentaje(2, 3)).toBe(66.7);
    expect(porcentaje(0, 0)).toBeNull();
  });
});
