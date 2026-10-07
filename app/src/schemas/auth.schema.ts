import { z } from 'zod';

// Política de contraseñas configurada en Clerk.
export const PASSWORD_MIN_LENGTH = 15;

export const loginSchema = z.object({
  emailAddress: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio.')
    .pipe(z.email('Ingresa un correo electrónico válido.')),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria.')
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'El nombre es obligatorio.')
      .min(2, 'El nombre debe tener al menos 2 caracteres.'),
    lastName: z
      .string()
      .trim()
      .min(1, 'El apellido es obligatorio.')
      .min(2, 'El apellido debe tener al menos 2 caracteres.'),
    emailAddress: z
      .string()
      .trim()
      .min(1, 'El correo electrónico es obligatorio.')
      .pipe(z.email('Ingresa un correo electrónico válido.')),
    password: z
      .string()
      .min(1, 'La contraseña es obligatoria.')
      .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`),
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar tu contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código de verificación es obligatorio.')
    .length(6, 'El código debe ser de exactamente 6 dígitos.')
    .regex(/^\d{6}$/, 'El código solo debe contener dígitos numéricos.'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
