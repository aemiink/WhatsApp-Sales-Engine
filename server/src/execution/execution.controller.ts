import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { EndHandoffExecutionDto } from './dto/end-handoff.dto';
import { ManualSendMessageDto } from './dto/manual-send-message.dto';
import { SetAiModeDto } from './dto/set-ai-mode.dto';
import { StartHandoffExecutionDto } from './dto/start-handoff.dto';
import { AiModeService } from './services/ai-mode.service';
import { ExecutionService } from './services/execution.service';
import type { ReplyExecutionResult } from './services/reply-executor.service';

@ApiTags('execution')
@ApiBearerAuth('bearer')
@Controller('conversations')
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly aiModeService: AiModeService,
  ) {}

  @Roles('admin', 'agent')
  @Post(':id/send')
  async manualSend(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Body() body: ManualSendMessageDto,
  ): Promise<ReplyExecutionResult> {
    return this.executionService.manualSend(
      conversationId,
      body,
      user.workspaceId,
    );
  }

  @Roles('admin', 'agent')
  @Patch(':id/ai-mode')
  async setAiMode(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Body() body: SetAiModeDto,
  ) {
    return this.aiModeService.setMode(
      conversationId,
      body.mode,
      user.workspaceId,
    );
  }

  @Roles('admin', 'agent')
  @Post(':id/handoff')
  async startHandoff(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Body() body: StartHandoffExecutionDto,
  ) {
    return this.executionService.startManualHandoff(
      conversationId,
      body,
      user.workspaceId,
    );
  }

  @Roles('admin', 'agent')
  @Post(':id/handoff/end')
  async endHandoff(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Body() body: EndHandoffExecutionDto,
  ) {
    return this.executionService.endManualHandoff(
      conversationId,
      body,
      user.workspaceId,
    );
  }
}
