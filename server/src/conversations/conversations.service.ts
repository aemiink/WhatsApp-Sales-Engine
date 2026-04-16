import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(input: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        workspaceId: input.workspaceId,
        phoneNumber: input.phoneNumber,
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
}
