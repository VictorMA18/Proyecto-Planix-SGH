import { registerDecorator, ValidationOptions } from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de calendario real en formato `YYYY-MM-DD` (rechaza, por ejemplo, `2026-02-30`). */
export function EsFecha(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'esFecha',
      target: object.constructor,
      propertyName,
      options: {
        message: 'La fecha debe tener el formato AAAA-MM-DD.',
        ...options,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !FECHA.test(value)) return false;
          const fecha = new Date(`${value}T00:00:00Z`);
          return (
            !Number.isNaN(fecha.getTime()) &&
            fecha.toISOString().startsWith(value)
          );
        },
      },
    });
}
