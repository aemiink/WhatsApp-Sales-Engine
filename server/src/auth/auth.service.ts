import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { WorkspaceRole } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AppRole, RequestUser } from './interfaces/request-user.interface';
import { TokenRevocationService } from './services/token-revocation.service';
import { createPasswordHash, verifyPassword } from './utils/password-hash.util';

interface AuthTokenPayload {
  sub: string;
  email: string;
  workspaceId: string;
  role: AppRole;
  type: 'access' | 'refresh';
  sid: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
    private readonly tokenRevocationService: TokenRevocationService,
  ) {}

  async login(input: LoginDto) {
    const normalizedEmail = input.email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user && this.appConfigService.authAllowDevBootstrap) {
      user = await this.bootstrapDevelopmentUser(input);
    }

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = this.resolveMembership(
      user.memberships,
      input.workspaceId,
    );
    if (!membership) {
      throw new UnauthorizedException('No workspace membership found for user');
    }

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      role: this.toAppRole(membership.role),
    });
  }

  async refresh(input: RefreshTokenDto) {
    let payload: AuthTokenPayload;

    try {
      payload = this.jwtService.verify<AuthTokenPayload>(input.refreshToken, {
        secret: this.appConfigService.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    if (!payload.sid || payload.sid.trim().length === 0) {
      throw new UnauthorizedException('Refresh token session is missing');
    }

    if (await this.tokenRevocationService.isTokenRevoked(payload.sid)) {
      throw new UnauthorizedException('Refresh token session has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        memberships: {
          where: {
            workspaceId: payload.workspaceId,
          },
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      throw new UnauthorizedException(
        'Refresh token context is no longer valid',
      );
    }

    const membership = user.memberships[0];

    const sessionIsValid =
      await this.tokenRevocationService.validateSessionContext({
        tokenId: payload.sid,
        userId: user.id,
        workspaceId: membership.workspaceId,
      });

    if (!sessionIsValid) {
      throw new UnauthorizedException(
        'Refresh token session context is invalid',
      );
    }

    await this.tokenRevocationService.touchSession(payload.sid);

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      role: this.toAppRole(membership.role),
      tokenId: payload.sid,
    });
  }

  async me(user: RequestUser) {
    const found = await this.prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      include: {
        memberships: {
          where: {
            workspaceId: user.workspaceId,
          },
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!found || found.memberships.length === 0) {
      throw new NotFoundException('Authenticated user context not found');
    }

    const membership = found.memberships[0];

    return {
      user: {
        id: found.id,
        email: found.email,
        displayName: found.displayName,
      },
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: this.toAppRole(membership.role),
      },
    };
  }

  private async issueTokens(input: {
    userId: string;
    email: string;
    displayName: string | null;
    workspaceId: string;
    workspaceName: string;
    role: AppRole;
    tokenId?: string;
  }) {
    const sessionTokenId = input.tokenId ?? randomUUID();
    const accessPayload: AuthTokenPayload = {
      sub: input.userId,
      email: input.email,
      workspaceId: input.workspaceId,
      role: input.role,
      type: 'access',
      sid: sessionTokenId,
    };

    const refreshPayload: AuthTokenPayload = {
      ...accessPayload,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.appConfigService.jwtAccessSecret,
        expiresIn: this.appConfigService.jwtAccessExpiresInSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.appConfigService.jwtRefreshSecret,
        expiresIn: this.appConfigService.jwtRefreshExpiresInSeconds,
      }),
    ]);

    await this.tokenRevocationService.registerSession({
      tokenId: sessionTokenId,
      userId: input.userId,
      email: input.email,
      workspaceId: input.workspaceId,
      expiresAt: new Date(
        Date.now() + this.appConfigService.jwtRefreshExpiresInSeconds * 1000,
      ),
    });

    return {
      accessToken,
      refreshToken,
      tokenId: sessionTokenId,
      expiresIn: this.appConfigService.jwtAccessExpiresInSeconds,
      user: {
        id: input.userId,
        email: input.email,
        displayName: input.displayName,
      },
      workspace: {
        id: input.workspaceId,
        name: input.workspaceName,
        role: input.role,
      },
    };
  }

  private toAppRole(role: WorkspaceRole): AppRole {
    if (role === WorkspaceRole.ADMIN) {
      return 'admin';
    }

    if (role === WorkspaceRole.VIEWER) {
      return 'viewer';
    }

    return 'agent';
  }

  private resolveMembership(
    memberships: Array<{
      workspaceId: string;
      role: WorkspaceRole;
      workspace: {
        id: string;
        name: string;
      };
    }>,
    requestedWorkspaceId?: string,
  ) {
    if (requestedWorkspaceId) {
      return (
        memberships.find(
          (membership) => membership.workspaceId === requestedWorkspaceId,
        ) ?? null
      );
    }

    return memberships[0] ?? null;
  }

  private async bootstrapDevelopmentUser(input: LoginDto) {
    const workspaceId = input.workspaceId ?? 'default-workspace';

    const workspace = await this.prisma.workspace.upsert({
      where: {
        id: workspaceId,
      },
      update: {},
      create: {
        id: workspaceId,
        name:
          workspaceId === 'default-workspace'
            ? 'Default Workspace'
            : workspaceId,
      },
    });

    const createdUser = await this.prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        passwordHash: createPasswordHash(input.password),
        displayName: input.email.split('@')[0] ?? 'User',
      },
    });

    await this.prisma.workspaceMember.create({
      data: {
        userId: createdUser.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.ADMIN,
      },
    });

    this.logger.log(
      `Development bootstrap user created email=${createdUser.email} workspaceId=${workspace.id}`,
    );

    return this.prisma.user.findUniqueOrThrow({
      where: {
        id: createdUser.id,
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}
