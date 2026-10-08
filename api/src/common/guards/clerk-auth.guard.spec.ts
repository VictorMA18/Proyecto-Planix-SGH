import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

const verifyTokenMock = verifyToken as unknown as jest.Mock;

interface FakeRequest {
  headers: { authorization?: string };
  user?: unknown;
}

function contexto(authorization?: string) {
  const request: FakeRequest = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('ClerkAuthGuard', () => {
  const guard = new ClerkAuthGuard();

  beforeEach(() => verifyTokenMock.mockReset());

  it('acepta un token válido y expone la identidad (verifyToken devuelve el payload)', async () => {
    verifyTokenMock.mockResolvedValue({
      sub: 'user_123',
      sid: 'sess_456',
      exp: 9999999999,
    });
    const { context, request } = contexto('Bearer token-valido');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      clerkId: 'user_123',
      sessionId: 'sess_456',
    });
    expect(verifyTokenMock).toHaveBeenCalledWith(
      'token-valido',
      expect.any(Object),
    );
  });

  it('rechaza sin cabecera Bearer', async () => {
    const { context } = contexto(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('informa cuando el token expiró', async () => {
    verifyTokenMock.mockRejectedValue({ reason: 'token-expired' });
    const { context } = contexto('Bearer viejo');
    await expect(guard.canActivate(context)).rejects.toThrow(
      'La sesión expiró',
    );
  });

  it('rechaza un token inválido o sin sub', async () => {
    verifyTokenMock.mockRejectedValueOnce({
      reason: 'token-invalid-signature',
    });
    await expect(
      guard.canActivate(contexto('Bearer malo').context),
    ).rejects.toThrow(UnauthorizedException);

    verifyTokenMock.mockResolvedValueOnce({ sid: 'sess_456' });
    await expect(
      guard.canActivate(contexto('Bearer sin-sub').context),
    ).rejects.toThrow(UnauthorizedException);
  });
});
