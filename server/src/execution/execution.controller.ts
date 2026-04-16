import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { EndHandoffExecutionDto } from './dto/end-handoff.dto';
import { ManualSendMessageDto } from './dto/manual-send-message.dto';
import { SetAiModeDto } from './dto/set-ai-mode.dto';
import { StartHandoffExecutionDto } from './dto/start-handoff.dto';
import { AiModeService } from './services/ai-mode.service';
import { ExecutionService } from './services/execution.service';
import type { ReplyExecutionResult } from './services/reply-executor.service';

@Controller('conversations')
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly aiModeService: AiModeService,
  ) {}

  @Post(':id/send')
  async manualSend(
    @Param('id') conversationId: string,
    @Body() body: ManualSendMessageDto,
  ): Promise<ReplyExecutionResult> {
    return this.executionService.manualSend(conversationId, body);
  }

  @Patch(':id/ai-mode')
  async setAiMode(
    @Param('id') conversationId: string,
    @Body() body: SetAiModeDto,
  ) {
    return this.aiModeService.setMode(conversationId, body.mode);
  }

  @Post(':id/handoff')
  async startHandoff(
    @Param('id') conversationId: string,
    @Body() body: StartHandoffExecutionDto,
  ) {
    return this.executionService.startManualHandoff(conversationId, body);
  }

  @Post(':id/handoff/end')
  async endHandoff(
    @Param('id') conversationId: string,
    @Body() body: EndHandoffExecutionDto,
  ) {
    return this.executionService.endManualHandoff(conversationId, body);
  }
}
