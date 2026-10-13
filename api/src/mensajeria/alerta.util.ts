import type { ModoAlerta } from '@prisma/client';

/**
 * Cómo suena cada modo. En Android el sonido y la vibración los decide el canal, que la app crea
 * como `alerta_<modo>` (`alerta_sonido`, `alerta_vibracion`, `alerta_silencio`); en iOS, `sound`; en la web, `silent`.
 */
export function opcionesAlerta(modo: ModoAlerta) {
  return {
    canalAndroid: `alerta_${modo.toLowerCase()}`,
    sonido: modo === 'SONIDO' ? ('default' as const) : null,
    prioridad: modo === 'SILENCIO' ? ('normal' as const) : ('high' as const),
    silenciosaWeb: modo !== 'SONIDO',
    vibrarWeb: modo === 'VIBRACION',
  };
}
