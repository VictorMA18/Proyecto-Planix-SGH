import { opcionesAlerta } from '../../../mensajeria/alerta.util';
import {
  comentarioTarea,
  dentroDeLosProximos,
  describirDias,
  destinatariosTarea,
  miembroNuevo,
  recortar,
  rutaDeNotificacion,
  tareaMovida,
  turnoAsignado,
} from './mensajes.util';

describe('mensajes de notificación', () => {
  it('incluye a quien provoca el evento dentro del contenido', () => {
    expect(tareaMovida('Ana P.', 'Inventario', 'REVISION')).toEqual({
      titulo: 'Tarea movida a Revisión',
      contenido: 'Ana P. movió «Inventario» a Revisión.',
    });
    expect(tareaMovida('Ana P.', 'Inventario', 'COMPLETADA').titulo).toBe(
      'Tarea completada',
    );
    expect(miembroNuevo('Sofía V.', 'SUPERVISOR').contenido).toBe(
      'Sofía V. se unió a la organización como supervisor.',
    );
  });

  it('recorta los comentarios largos', () => {
    const { contenido } = comentarioTarea('Ana', 'T', 'x'.repeat(200));
    expect(contenido.length).toBeLessThan(110);
    expect(contenido).toContain('…');
    expect(recortar('  hola   mundo ')).toBe('hola mundo');
  });

  it('describe los días del turno', () => {
    expect(describirDias([5, 1, 2, 3, 4])).toBe('de lunes a viernes');
    expect(describirDias([1, 2, 3, 4, 5, 6, 7])).toBe('todos los días');
    expect(describirDias([6, 7])).toBe('los fines de semana');
    expect(describirDias([5, 1, 3])).toBe('lun, mié, vie');
    expect(
      turnoAsignado('Carlos', {
        nombre: 'Turno Mañana',
        horaInicio: '08:00',
        horaFin: '17:00',
        dias: [1, 2, 3, 4, 5],
      }).contenido,
    ).toBe(
      'Carlos te asignó el Turno Mañana (08:00 - 17:00), de lunes a viernes.',
    );
  });

  it('avisa a asignados y creador sin repetir y sin el actor', () => {
    expect(destinatariosTarea(['a', 'b', 'a'], 'c', 'b')).toEqual(['a', 'c']);
    expect(destinatariosTarea(['a'], 'a', 'z')).toEqual(['a']);
    expect(destinatariosTarea(['a'], null, 'a')).toEqual([]);
  });

  it('lleva a la pantalla de cada tipo', () => {
    expect(rutaDeNotificacion('TAREA_ASIGNADA', 't1')).toBe('/tarea/t1');
    expect(rutaDeNotificacion('TURNO_ACTUALIZADO', null)).toBe('/mi-turno');
    expect(rutaDeNotificacion('RECORDATORIO_ENTRADA', null)).toBe(
      '/asistencia',
    );
    expect(rutaDeNotificacion('MIEMBRO_NUEVO', 'm1')).toBe('/miembro/m1');
    expect(rutaDeNotificacion('AVISO', null)).toBe('/notificaciones');
  });

  it('la ventana del recordatorio excluye el presente e incluye el límite', () => {
    const ahora = new Date('2026-10-12T13:00:00Z');
    const en = (min: number) => new Date(ahora.getTime() + min * 60_000);
    expect(dentroDeLosProximos(en(15), ahora, 15)).toBe(true);
    expect(dentroDeLosProximos(en(1), ahora, 15)).toBe(true);
    expect(dentroDeLosProximos(en(0), ahora, 15)).toBe(false);
    expect(dentroDeLosProximos(en(16), ahora, 15)).toBe(false);
  });
});

describe('opcionesAlerta', () => {
  it('traduce el modo a canal, sonido y prioridad', () => {
    expect(opcionesAlerta('SONIDO')).toMatchObject({
      canalAndroid: 'alerta_sonido',
      sonido: 'default',
      prioridad: 'high',
      silenciosaWeb: false,
    });
    expect(opcionesAlerta('VIBRACION')).toMatchObject({
      canalAndroid: 'alerta_vibracion',
      sonido: null,
      vibrarWeb: true,
    });
    expect(opcionesAlerta('SILENCIO')).toMatchObject({
      sonido: null,
      prioridad: 'normal',
      silenciosaWeb: true,
    });
  });
});
