import { Prisma } from '@prisma/client';

/** El error es una violación de una restricción UNIQUE (dos peticiones simultáneas, por ejemplo). */
export function esUnicoDuplicado(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}
