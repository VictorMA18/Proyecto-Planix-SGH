import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

/** Claims del token de sesión de Clerk que usa el backend. */
interface ClerkSessionClaims {
  sub?: string;
  sid?: string;
}

export interface AuthenticatedUser {
  clerkId: string;
  sessionId?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Header Authorization Bearer no proporcionado o inválido');
    }

    const token = authHeader.slice('Bearer '.length).trim();

    let claims: ClerkSessionClaims;
    try {
      // En @clerk/backend 3.x `verifyToken` devuelve el payload del JWT y lanza una excepción si
      // el token no es válido (su tipo declarado no coincide con el comportamiento real).
      claims = (await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        jwtKey: process.env.CLERK_JWT_KEY,
      })) as unknown as ClerkSessionClaims;
    } catch (err: any) {
      const expirado = err?.reason === 'token-expired';
      this.logger.warn(`Token rechazado: ${err?.reason ?? err?.message}`);
      throw new UnauthorizedException(
        expirado
          ? 'La sesión expiró. Vuelve a intentarlo.'
          : 'Token de sesión Clerk inválido',
      );
    }

    if (!claims?.sub) {
      throw new UnauthorizedException('Token de sesión Clerk inválido');
    }

    request.user = { clerkId: claims.sub, sessionId: claims.sid } satisfies AuthenticatedUser;
    return true;
  }
}
