import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WorkspaceMember, User } from '@prisma/client';

type MemberWithUser = WorkspaceMember & { user: User };

export interface ConversationWorkspaceContext {
  id: string;
  workspaceId: string;
}

export interface HandoffSessionWorkspaceContext {
  id: string;
  conversationId: string;
  workspaceId: string;
}

export interface ConversationWorkspaceContext {
  id: string;
  workspaceId: string;
}

export interface HandoffSessionWorkspaceContext {
  id: string;
  conversationId: string;
  workspaceId: string;
}

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertConversationInWorkspace(
    conversationId: string,
    workspaceId: string,
  ): Promise<ConversationWorkspaceContext> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, workspaceId: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.workspaceId !== workspaceId) {
      throw new ForbiddenException('Conversation does not belong to workspace');
    }

    return conversation;
  }

  async assertHandoffSessionInWorkspace(
    sessionId: string,
    workspaceId: string,
  ): Promise<HandoffSessionWorkspaceContext> {
    const session = await this.prisma.handoffSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        conversationId: true,
        conversation: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Handoff session not found');
    }

    if (session.conversation.workspaceId !== workspaceId) {
      throw new ForbiddenException(
        'Handoff session does not belong to workspace',
      );
    }

    return {
      id: session.id,
      conversationId: session.conversationId,
      workspaceId: session.conversation.workspaceId,
    };
  }

  async getWorkspaceMembers(workspaceId: string): Promise<MemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    }) as Promise<MemberWithUser[]>;
  }
}
