import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { TrackAnalyticsEventDto } from './dto/track-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(input: TrackAnalyticsEventDto) {
    return this.prisma.analyticsEvent.create({
      data: {
        workspaceId: input.workspaceId,
        type: input.type,
        payloadJson: input.payloadJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getWorkspaceEvents(workspaceId: string) {
    return this.prisma.analyticsEvent.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
