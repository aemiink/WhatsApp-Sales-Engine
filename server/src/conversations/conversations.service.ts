import { Injectable, Logger } from '@nestjs/common';
import { LeadStage, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

interface CreateConversationInput {
  workspaceId: string;
  phoneNumber: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return true;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createConversation(input: CreateConversationInput) {
    return this.prisma.conversation.create({
      data: {
        workspaceId: input.workspaceId,
        phoneNumber: input.phoneNumber,
      },
    });
  }

  async findOrCreateByPhone(workspaceId: string, phoneNumber: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: {
        workspaceId_phoneNumber: {
          workspaceId,
          phoneNumber,
        },
      },
    });

    if (existing) {
      return existing;
    }

    try {
      const created = await this.prisma.conversation.create({
        data: {
          workspaceId,
          phoneNumber,
        },
      });

      this.logger.log(
        `Conversation created workspaceId=${workspaceId} phone=${phoneNumber}`,
      );

      return created;
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return this.prisma.conversation.findUniqueOrThrow({
          where: {
            workspaceId_phoneNumber: {
              workspaceId,
              phoneNumber,
            },
          },
        });
      }

      throw error;
    }
  }

  async listConversations(workspaceId: string) {
    return this.prisma.conversation.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        phoneNumber: true,
        leadStage: true,
        status: true,
        aiMode: true,
        lastMessageAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getConversationDetail(conversationId: string, workspaceId?: string) {
    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getWorkspaceConversations(workspaceId: string) {
    return this.prisma.conversation.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });
  }

  async updateLeadStage(conversationId: string, leadStage: LeadStage) {
    return this.prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        leadStage,
      },
      select: {
        id: true,
        workspaceId: true,
        leadStage: true,
      },
    });
  }
}
