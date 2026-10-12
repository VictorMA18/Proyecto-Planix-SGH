import {
  isISO8601,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * La fecha ISO de esta propiedad no es anterior a la de `campo`. Si alguna de las dos no es una
 * fecha ISO válida, no se valida aquí: lo reporta su propio validador.
 */
export function NoAnteriorA(campo: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'noAnteriorA',
      target: object.constructor,
      propertyName,
      constraints: [campo],
      options: {
        message: 'La hora de fin no puede ser anterior a la de inicio.',
        ...options,
      },
      validator: {
        validate(valor: unknown, args: ValidationArguments) {
          const otro = (args.object as Record<string, unknown>)[campo];
          if (
            typeof valor !== 'string' ||
            typeof otro !== 'string' ||
            !isISO8601(valor, { strict: true }) ||
            !isISO8601(otro, { strict: true })
          ) {
            return true;
          }
          return Date.parse(valor) >= Date.parse(otro);
        },
      },
    });
}
