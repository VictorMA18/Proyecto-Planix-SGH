import type { Usuario } from '@prisma/client';

export class UsuarioResponseDto {
  id!: string;
  clerkId!: string;
  nombre!: string;
  nombres!: string;
  apellidos!: string;
  email!: string;
  emailVerificado!: boolean;
  avatarUrl!: string | null;
  activo!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static desde(usuario: Usuario): UsuarioResponseDto {
    return Object.assign(new UsuarioResponseDto(), {
      id: usuario.id,
      clerkId: usuario.clerkId,
      nombre: usuario.nombre,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      emailVerificado: usuario.emailVerificado,
      avatarUrl: usuario.avatarUrl,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    });
  }
}
