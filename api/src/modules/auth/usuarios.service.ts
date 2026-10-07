import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { User } from '@clerk/backend';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClerkService } from './clerk.service';

export interface DatosUsuarioClerk {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  has_image?: boolean;
  primary_email_address_id?: string | null;
  email_addresses?: {
    id: string;
    email_address: string;
    verification?: { status?: string | null } | null;
  }[];
}

/** Adapta el usuario del SDK backend de Clerk al mismo formato que envía el webhook. */
export function datosDesdeUsuarioClerk(user: User): DatosUsuarioClerk {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    image_url: user.imageUrl,
    has_image: user.hasImage,
    primary_email_address_id: user.primaryEmailAddressId,
    email_addresses: user.emailAddresses.map((e) => ({
      id: e.id,
      email_address: e.emailAddress,
      verification: { status: e.verification?.status },
    })),
  };
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkService,
  ) {}

  /**
   * Devuelve el usuario local de un clerkId. Si todavía no existe (el webhook aún no llegó,
   * p. ej. en desarrollo sin el retransmisor), lo crea consultando a Clerk.
   */
  async obtenerOCrear(clerkId: string): Promise<Usuario> {
    const existente = await this.prisma.usuario.findUnique({ where: { clerkId } });
    if (existente) {
      if (!existente.activo) throw new ForbiddenException('Usuario desactivado');
      return existente;
    }

    const usuarioClerk = await this.clerk.client.users.getUser(clerkId);
    return this.sincronizar(datosDesdeUsuarioClerk(usuarioClerk));
  }

  /** Crea o actualiza el usuario local a partir del payload de Clerk (webhook o API). */
  async sincronizar(data: DatosUsuarioClerk): Promise<Usuario> {
    const { email, verificado } = this.emailPrincipal(data);
    const nombres = (data.first_name ?? '').trim().slice(0, 100);
    const apellidos = (data.last_name ?? '').trim().slice(0, 100);
    const nombre = ([nombres, apellidos].filter(Boolean).join(' ') || email.split('@')[0]).slice(0, 150);
    const avatarUrl = data.has_image === false ? null : (data.image_url ?? null);
    const datos = { nombre, nombres, apellidos, email, emailVerificado: verificado, avatarUrl };

    return this.prisma.usuario.upsert({
      where: { clerkId: data.id },
      create: { clerkId: data.id, ...datos },
      update: { ...datos, activo: true },
    });
  }

  /** `user.deleted`: se desactiva en lugar de borrar para conservar el historial. */
  async desactivar(clerkId: string): Promise<void> {
    const { count } = await this.prisma.usuario.updateMany({
      where: { clerkId },
      data: { activo: false },
    });
    if (count === 0) this.logger.warn(`user.deleted de un usuario no sincronizado: ${clerkId}`);
  }

  private emailPrincipal(data: DatosUsuarioClerk): { email: string; verificado: boolean } {
    const lista = data.email_addresses ?? [];
    const principal = lista.find((e) => e.id === data.primary_email_address_id) ?? lista[0];
    if (!principal) throw new Error(`El usuario ${data.id} de Clerk no tiene correo`);
    return {
      email: principal.email_address.toLowerCase(),
      verificado: principal.verification?.status === 'verified',
    };
  }
}
