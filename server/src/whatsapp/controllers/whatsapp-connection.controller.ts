import { Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { WhatsAppConnectionService } from '../services/whatsapp-connection.service';

@ApiTags('whatsapp-connection')
@ApiBearerAuth('bearer')
@Controller('whatsapp/connection')
export class WhatsAppConnectionController {
  constructor(
    private readonly whatsappConnectionService: WhatsAppConnectionService,
  ) {}

  @Get()
  async getStatus(@CurrentUser() user: RequestUser) {
    return this.whatsappConnectionService.getConnectionStatus(user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Post('test')
  @HttpCode(200)
  async testConnection(@CurrentUser() user: RequestUser) {
    return this.whatsappConnectionService.testConnection(user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Post('reconnect')
  @HttpCode(200)
  async reconnect(@CurrentUser() user: RequestUser) {
    return this.whatsappConnectionService.reconnectConnection(user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Delete()
  @HttpCode(200)
  async remove(@CurrentUser() user: RequestUser) {
    return this.whatsappConnectionService.removeWorkspaceConnection(
      user.workspaceId,
    );
  }
}
