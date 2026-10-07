import { z } from 'zod';

export const createOrganizationSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la organización es obligatorio.')
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede superar los 150 caracteres.'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const joinOrganizationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Ingresa el código de invitación.')
    .regex(/^[A-Za-z0-9]{6,32}$/, 'El código solo contiene letras y números.')
    .transform((value) => value.toUpperCase()),
});

export type JoinOrganizationInput = z.input<typeof joinOrganizationSchema>;
