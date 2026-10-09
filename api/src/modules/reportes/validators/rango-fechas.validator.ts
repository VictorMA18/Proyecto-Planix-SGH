import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { diasEntre } from '../../../common/utils/zona-horaria.util';

/**
 * La fecha de esta propiedad no es anterior a la de `campoDesde` y el rango (ambos días incluidos)
 * no supera `maxDias`. Si alguna fecha es inválida, lo reporta su propio validador.
 */
export function RangoDeFechas(
  campoDesde: string,
  maxDias: number,
  options?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'rangoDeFechas',
      target: object.constructor,
      propertyName,
      constraints: [campoDesde, maxDias],
      options: {
        message: `El rango debe ir de «desde» a «hasta» y no superar los ${maxDias} días.`,
        ...options,
      },
      validator: {
        validate(hasta: unknown, args: ValidationArguments) {
          const desde = (args.object as Record<string, unknown>)[campoDesde];
          if (typeof desde !== 'string' || typeof hasta !== 'string')
            return true;
          const dias = diasEntre(desde, hasta);
          if (Number.isNaN(dias)) return true;
          return dias >= 0 && dias + 1 <= maxDias;
        },
      },
    });
}
