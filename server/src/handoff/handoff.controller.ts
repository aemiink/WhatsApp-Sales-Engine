import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { EndHandoffDto } from './dto/end-handoff.dto';
import { StartHandoffDto } from './dto/start-handoff.dto';
import { HandoffService } from './handoff.service';

@Controller('handoff')
export class HandoffController {
  constructor(private readonly handoffService: HandoffService) {}

  @Roles('admin', 'agent')
  @Post('sessions')
  async startSession(@Body() body: StartHandoffDto) {
    return this.handoffService.startSession(body);
  }

  @Roles('admin', 'agent')
  @Patch('sessions/:sessionId/end')
  async endSession(
    @Param('sessionId') sessionId: string,
    @Body() body: EndHandoffDto,
  ) {
    return this.handoffService.endSession(sessionId, body);
  }
}
