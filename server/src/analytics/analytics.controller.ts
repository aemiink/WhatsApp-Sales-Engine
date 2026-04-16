import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrackAnalyticsEventDto } from './dto/track-analytics-event.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  async trackEvent(@Body() body: TrackAnalyticsEventDto) {
    return this.analyticsService.trackEvent(body);
  }

  @Get('workspace/:workspaceId/events')
  async findWorkspaceEvents(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getWorkspaceEvents(workspaceId);
  }
}
