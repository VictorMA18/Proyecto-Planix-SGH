import { registerDecorator, ValidationOptions } from 'class-validator';

/** La cadena debe ser una zona horaria IANA reconocida (p. ej. `America/Lima`). */
export function EsZonaHoraria(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'esZonaHoraria',
      target: object.constructor,
      propertyName,
      options: { message: 'La zona horaria no es válida.', ...options },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          try {
            new Intl.DateTimeFormat('es', { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
      },
    });
}
