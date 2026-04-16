import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { EndHandoffDto } from './dto/end-handoff.dto';
import { StartHandoffDto } from './dto/start-handoff.dto';
import { HandoffService } from './handoff.service';

@Controller('handoff')
export class HandoffController {
  constructor(private readonly handoffService: HandoffService) {}

  @Post('sessions')
  async startSession(@Body() body: StartHandoffDto) {
    return this.handoffService.startSession(body);
  }

  @Patch('sessions/:sessionId/end')
  async endSession(
    @Param('sessionId') sessionId: string,
    @Body() body: EndHandoffDto,
  ) {
    return this.handoffService.endSession(sessionId, body);
  }
}
