import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { TrackAnalyticsEventDto } from './dto/track-analytics-event.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles('admin', 'agent')
  @Post('events')
  async trackEvent(
    @CurrentUser() user: RequestUser,
    @Body() body: TrackAnalyticsEventDto,
  ) {
    return this.analyticsService.trackEvent({
      workspaceId: user.workspaceId,
      conversationId: body.conversationId,
      type: body.type,
      payloadJson: body.payloadJson,
    });
  }

  @Get('workspace/:workspaceId/events')
  async findWorkspaceEvents(
    @CurrentUser() user: RequestUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    if (workspaceId !== user.workspaceId) {
      throw new ForbiddenException('Workspace mismatch');
    }

    return this.analyticsService.getWorkspaceEvents(user.workspaceId);
  }

  @Get('overview')
  async getOverview(
    @CurrentUser() user: RequestUser,
    @Query() _query: GetAnalyticsQueryDto,
  ) {
    return this.analyticsService.getOverview(user.workspaceId);
  }

  @Get('funnel')
  async getFunnel(
    @CurrentUser() user: RequestUser,
    @Query() _query: GetAnalyticsQueryDto,
  ) {
    return this.analyticsService.getFunnel(user.workspaceId);
  }

  @Get('conversations')
  async getConversationMetrics(
    @CurrentUser() user: RequestUser,
    @Query() _query: GetAnalyticsQueryDto,
  ) {
    return this.analyticsService.getConversationMetrics(user.workspaceId);
  }

  @Get('ai')
  async getAiPerformance(
    @CurrentUser() user: RequestUser,
    @Query() _query: GetAnalyticsQueryDto,
  ) {
    return this.analyticsService.getAiPerformance(user.workspaceId);
  }
}
