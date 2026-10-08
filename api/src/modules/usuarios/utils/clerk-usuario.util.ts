import type { User } from '@clerk/backend';
import type { DatosUsuarioClerk } from '../interfaces/datos-usuario-clerk.interface';

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
