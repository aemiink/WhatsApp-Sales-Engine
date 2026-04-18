import { JwtService } from '@nestjs/jwt';
import type { AppRole } from '../../src/auth/interfaces/request-user.interface';

interface AccessTokenInput {
  userId?: string;
  email?: string;
  workspaceId?: string;
  role?: AppRole;
  sid?: string;
  expiresInSeconds?: number;
}

export function createAccessToken(input?: AccessTokenInput): string {
  const jwtService = new JwtService();

  return jwtService.sign(
    {
      sub: input?.userId ?? 'test-user',
      email: input?.email ?? 'test@example.com',
      workspaceId: input?.workspaceId ?? 'default-workspace',
      role: input?.role ?? 'admin',
      type: 'access',
      sid: input?.sid ?? 'test-session-id',
    },
    {
      secret: process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-value',
      expiresIn: input?.expiresInSeconds ?? 900,
    },
  );
}

export function asBearer(token: string): string {
  return `Bearer ${token}`;
}
