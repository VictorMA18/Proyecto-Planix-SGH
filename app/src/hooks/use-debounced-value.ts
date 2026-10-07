import { useEffect, useState } from 'react';

/** Devuelve `value` tras `delay` ms sin cambios (p. ej. para no consultar en cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
