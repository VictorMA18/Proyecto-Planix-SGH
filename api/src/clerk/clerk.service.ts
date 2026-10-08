import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';

/** Cliente único del SDK backend de Clerk (credenciales solo en variables de entorno). */
@Injectable()
export class ClerkService {
  readonly client = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || 'sk_test_placeholder',
  });
}
