import { Injectable } from '@nestjs/common';
import { WorkspaceAccessService } from '../common/services/workspace-access.service';
import { PrismaService } from '../database/prisma.service';
import { EndHandoffDto } from './dto/end-handoff.dto';
import { StartHandoffDto } from './dto/start-handoff.dto';

@Injectable()
export class HandoffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async startSession(input: StartHandoffDto, workspaceId?: string) {
    if (workspaceId) {
      await this.workspaceAccessService.assertConversationInWorkspace(
        input.conversationId,
        workspaceId,
      );
    }

    return this.prisma.handoffSession.create({
      data: {
        conversationId: input.conversationId,
      },
    });
  }

  async endSession(
    sessionId: string,
    input: EndHandoffDto,
    workspaceId?: string,
  ) {
    if (workspaceId) {
      await this.workspaceAccessService.assertHandoffSessionInWorkspace(
        sessionId,
        workspaceId,
      );
    }

    return this.prisma.handoffSession.update({
      where: {
        id: sessionId,
      },
      data: {
        endedAt: input.endedAt ? new Date(input.endedAt) : new Date(),
      },
    });
  }
}
