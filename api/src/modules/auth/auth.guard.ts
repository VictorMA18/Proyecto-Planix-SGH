import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || 'sk_test_placeholder',
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Header Authorization Bearer no proporcionado o inválido');
    }

    const token = authHeader.split(' ')[1];

    try {
      const verifiedToken = await this.clerkClient.authenticateRequest(request, {
        jwtKey: process.env.CLERK_JWT_KEY,
      });

      if (!verifiedToken.isSignedIn) {
        throw new UnauthorizedException('Token de sesión Clerk inválido o expirado');
      }

      const authState = verifiedToken.toAuth();
      request.user = {
        clerkId: authState.userId,
        sessionId: authState.sessionId,
      };

      return true;
    } catch (err: any) {
      throw new UnauthorizedException(`Fallo en autenticación Clerk: ${err.message}`);
    }
  }
}
