import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface SessionRecord {
  tokenId: string;
  email: string;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
}

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerSession(input: {
    tokenId: string;
    userId: string;
    email: string;
    workspaceId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.authSession.upsert({
      where: {
        tokenId: input.tokenId,
      },
      create: {
        tokenId: input.tokenId,
        userId: input.userId,
        email: input.email,
        workspaceId: input.workspaceId,
        expiresAt: input.expiresAt,
      },
      update: {
        userId: input.userId,
        email: input.email,
        workspaceId: input.workspaceId,
        revokedAt: null,
        expiresAt: input.expiresAt,
      },
    });
  }

  async isTokenRevoked(tokenId: string): Promise<boolean> {
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenId,
      },
      select: {
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return true;
    }

    if (session.revokedAt) {
      return true;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return true;
    }

    return false;
  }

  async revokeToken(
    tokenId: string,
    workspaceId?: string,
  ): Promise<{ revokedCount: number }> {
    const updated = await this.prisma.authSession.updateMany({
      where: {
        tokenId,
        ...(workspaceId ? { workspaceId } : {}),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      revokedCount: updated.count,
    };
  }

  async revokeAllUserSessions(
    userId: string,
  ): Promise<{ revokedCount: number }> {
    const updated = await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      revokedCount: updated.count,
    };
  }

  async revokeWorkspaceSessions(
    workspaceId: string,
    exceptUserId?: string,
  ): Promise<{ revokedCount: number }> {
    const updated = await this.prisma.authSession.updateMany({
      where: {
        workspaceId,
        revokedAt: null,
        ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      revokedCount: updated.count,
    };
  }

  async listActiveSessions(workspaceId: string): Promise<SessionRecord[]> {
    const rows = await this.prisma.authSession.findMany({
      where: {
        workspaceId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
      select: {
        tokenId: true,
        email: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });

    return rows.map((session) => ({
      tokenId: session.tokenId,
      email: session.email,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt?.toISOString() ?? null,
      expiresAt: session.expiresAt.toISOString(),
    }));
  }

  async validateSessionContext(input: {
    tokenId: string;
    userId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const session = await this.prisma.authSession.findUnique({
      where: {
        tokenId: input.tokenId,
      },
      select: {
        userId: true,
        workspaceId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return false;
    }

    if (
      session.userId !== input.userId ||
      session.workspaceId !== input.workspaceId
    ) {
      return false;
    }

    if (session.revokedAt) {
      return false;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    return true;
  }

  async touchSession(tokenId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        tokenId,
        revokedAt: null,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  async cleanup(): Promise<{ revokedCount: number }> {
    const updated = await this.prisma.authSession.updateMany({
      where: {
        revokedAt: null,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (updated.count > 0) {
      this.logger.log(`Expired sessions revoked count=${updated.count}`);
    }

    return {
      revokedCount: updated.count,
    };
  }
}
