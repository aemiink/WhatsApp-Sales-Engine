import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DEFAULT_WORKSPACE_ID } from '../common/constants/workspace.constants';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
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

  @Get('overview')
  async getOverview(@Query() query: GetAnalyticsQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.analyticsService.getOverview(workspaceId);
  }

  @Get('funnel')
  async getFunnel(@Query() query: GetAnalyticsQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.analyticsService.getFunnel(workspaceId);
  }

  @Get('conversations')
  async getConversationMetrics(@Query() query: GetAnalyticsQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.analyticsService.getConversationMetrics(workspaceId);
  }

  @Get('ai')
  async getAiPerformance(@Query() query: GetAnalyticsQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.analyticsService.getAiPerformance(workspaceId);
  }
}
