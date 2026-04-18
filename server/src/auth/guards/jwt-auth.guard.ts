import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../../config/app-config.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  APP_ROLES,
  AppRole,
  RequestUser,
} from '../interfaces/request-user.interface';
import { TokenRevocationService } from '../services/token-revocation.service';

interface JwtPayload {
  sub: string;
  email: string;
  workspaceId: string;
  role: AppRole;
  type: 'access' | 'refresh';
  sid: string;
}

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user?: RequestUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
    private readonly tokenRevocationService: TokenRevocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (
      this.appConfigService.nodeEnv === 'test' &&
      this.appConfigService.authBypassInTest
    ) {
      request.user = {
        userId: 'test-user',
        email: 'test@example.com',
        workspaceId: 'default-workspace',
        role: 'admin',
      };
      return true;
    }

    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.appConfigService.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token type');
    }

    if (!APP_ROLES.includes(payload.role)) {
      throw new UnauthorizedException('Invalid role in token');
    }

    if (!payload.sid || payload.sid.trim().length === 0) {
      throw new UnauthorizedException('Access token session is missing');
    }

    if (!this.appConfigService.isTest) {
      if (await this.tokenRevocationService.isTokenRevoked(payload.sid)) {
        throw new UnauthorizedException(
          'Access token session has been revoked',
        );
      }

      const sessionContextValid =
        await this.tokenRevocationService.validateSessionContext({
          tokenId: payload.sid,
          userId: payload.sub,
          workspaceId: payload.workspaceId,
        });

      if (!sessionContextValid) {
        throw new UnauthorizedException(
          'Access token session context is invalid',
        );
      }

      await this.tokenRevocationService.touchSession(payload.sid);
    }

    request.user = {
      userId: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role,
    };

    return true;
  }

  private extractBearerToken(header?: string): string | null {
    if (!header) {
      return null;
    }

    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
