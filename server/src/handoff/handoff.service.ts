import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EndHandoffDto } from './dto/end-handoff.dto';
import { StartHandoffDto } from './dto/start-handoff.dto';

@Injectable()
export class HandoffService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(input: StartHandoffDto) {
    return this.prisma.handoffSession.create({
      data: {
        conversationId: input.conversationId,
      },
    });
  }

  async endSession(sessionId: string, input: EndHandoffDto) {
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
