import { Transform } from 'class-transformer';

/** Quita los espacios de los extremos de un texto antes de validarlo. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  );
