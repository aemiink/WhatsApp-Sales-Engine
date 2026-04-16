import { Injectable, NotFoundException } from '@nestjs/common';
import { AiMode } from '@prisma/client';
import { WorkspaceAccessService } from '../../common/services/workspace-access.service';
import { PrismaService } from '../../database/prisma.service';
import { AiModeValue } from '../dto/set-ai-mode.dto';

@Injectable()
export class AiModeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async setMode(
    conversationId: string,
    mode: AiModeValue,
    workspaceId?: string,
  ) {
    if (workspaceId) {
      await this.workspaceAccessService.assertConversationInWorkspace(
        conversationId,
        workspaceId,
      );
    }

    const updated = await this.prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        aiMode: this.toPrismaMode(mode),
      },
      select: {
        id: true,
        aiMode: true,
      },
    });

    return {
      conversationId: updated.id,
      mode: this.fromPrismaMode(updated.aiMode),
    };
  }

  async getMode(conversationId: string): Promise<AiModeValue> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        aiMode: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.fromPrismaMode(conversation.aiMode);
  }

  private toPrismaMode(mode: AiModeValue): AiMode {
    if (mode === 'suggest_only') {
      return AiMode.SUGGEST_ONLY;
    }
    if (mode === 'paused') {
      return AiMode.PAUSED;
    }

    return AiMode.AUTO_REPLY;
  }

  private fromPrismaMode(mode: AiMode): AiModeValue {
    if (mode === AiMode.SUGGEST_ONLY) {
      return 'suggest_only';
    }
    if (mode === AiMode.PAUSED) {
      return 'paused';
    }

    return 'auto_reply';
  }
}
