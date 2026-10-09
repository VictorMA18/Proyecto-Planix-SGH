import { registerDecorator, ValidationOptions } from 'class-validator';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Hora local en formato `HH:mm` de 24 horas (p. ej. `07:30`). */
export function EsHora(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'esHora',
      target: object.constructor,
      propertyName,
      options: {
        message: 'La hora debe tener el formato HH:mm (por ejemplo 07:30).',
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && HORA.test(value),
      },
    });
}
