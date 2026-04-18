import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { TokenRevocationService } from '../../auth/services/token-revocation.service';

interface SessionInfo {
  tokenId: string;
  email: string;
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
}

@Controller('sessions')
@Roles('admin')
export class SessionsController {
  constructor(
    private readonly tokenRevocationService: TokenRevocationService,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser): Promise<SessionInfo[]> {
    return this.tokenRevocationService.listActiveSessions(user.workspaceId);
  }

  @Post('revoke-all')
  async revokeAll(
    @CurrentUser() user: RequestUser,
  ): Promise<{ ok: boolean; message: string; revokedCount: number }> {
    const result = await this.tokenRevocationService.revokeWorkspaceSessions(
      user.workspaceId,
    );

    return {
      ok: true,
      message: `${result.revokedCount} oturum sonlandırıldı`,
      revokedCount: result.revokedCount,
    };
  }

  @Delete(':tokenId')
  async revoke(
    @CurrentUser() user: RequestUser,
    @Param('tokenId') tokenId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const result = await this.tokenRevocationService.revokeToken(
      tokenId,
      user.workspaceId,
    );

    if (result.revokedCount === 0) {
      return {
        ok: false,
        message: 'Oturum bulunamadi veya zaten sonlandirildi',
      };
    }

    return {
      ok: true,
      message: 'Oturum sonlandırıldı',
    };
  }
}
