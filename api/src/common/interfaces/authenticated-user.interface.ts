/** Identidad del usuario autenticado (claims del token de sesión de Clerk). */
export interface AuthenticatedUser {
  clerkId: string;
  sessionId?: string;
}
