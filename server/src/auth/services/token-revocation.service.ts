import { Injectable, Logger } from '@nestjs/common';

const revokedTokens = new Set<string>();
const sessionData = new Map<string, { userId: string; email: string; workspaceId: string; createdAt: number }>();

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  registerSession(tokenId: string, userId: string, email: string, workspaceId: string) {
    sessionData.set(tokenId, { userId, email, workspaceId, createdAt: Date.now() });
  }

  isTokenRevoked(tokenId: string): boolean {
    return revokedTokens.has(tokenId);
  }

  revokeToken(tokenId: string) {
    revokedTokens.add(tokenId);
  }

  revokeAllUserSessions(userId: string) {
    for (const [tokenId, data] of sessionData.entries()) {
      if (data.userId === userId) {
        revokedTokens.add(tokenId);
        sessionData.delete(tokenId);
      }
    }
  }

  revokeWorkspaceSessions(workspaceId: string, exceptUserId?: string) {
    for (const [tokenId, data] of sessionData.entries()) {
      if (data.workspaceId === workspaceId && data.userId !== exceptUserId) {
        revokedTokens.add(tokenId);
        sessionData.delete(tokenId);
      }
    }
  }

  listActiveSessions(workspaceId: string) {
    const sessions: Array<{ tokenId: string; email: string; createdAt: string }> = [];
    for (const [tokenId, data] of sessionData.entries()) {
      if (data.workspaceId === workspaceId) {
        sessions.push({
          tokenId,
          email: data.email,
          createdAt: new Date(data.createdAt).toISOString(),
        });
      }
    }
    return sessions;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    for (const [tokenId, data] of sessionData.entries()) {
      if (now - data.createdAt > maxAge) {
        sessionData.delete(tokenId);
        revokedTokens.add(tokenId);
      }
    }
  }
}