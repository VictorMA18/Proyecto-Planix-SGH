import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from './auth.schema';

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(50, 'El nombre no puede superar los 50 caracteres.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio.')
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(50, 'El apellido no puede superar los 50 caracteres.'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
    newPassword: z
      .string()
      .min(1, 'La nueva contraseña es obligatoria.')
      .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`),
    confirmPassword: z.string().min(1, 'Debes confirmar la nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual.',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
