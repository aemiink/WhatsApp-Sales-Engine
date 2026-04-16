import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { EndHandoffDto } from './dto/end-handoff.dto';
import { StartHandoffDto } from './dto/start-handoff.dto';
import { HandoffService } from './handoff.service';

@Controller('handoff')
export class HandoffController {
  constructor(private readonly handoffService: HandoffService) {}

  @Roles('admin', 'agent')
  @Post('sessions')
  async startSession(
    @CurrentUser() user: RequestUser,
    @Body() body: StartHandoffDto,
  ) {
    return this.handoffService.startSession(body, user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Patch('sessions/:sessionId/end')
  async endSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
    @Body() body: EndHandoffDto,
  ) {
    return this.handoffService.endSession(sessionId, body, user.workspaceId);
  }
}
