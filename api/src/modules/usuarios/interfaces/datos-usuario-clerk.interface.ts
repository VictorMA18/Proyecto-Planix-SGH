/** Datos de un usuario de Clerk con la forma del payload del webhook (`user.created` / `user.updated`). */
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
