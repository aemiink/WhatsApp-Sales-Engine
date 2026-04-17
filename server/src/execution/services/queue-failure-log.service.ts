import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

interface QueueFailureInput {
  queueName: string;
  jobId?: string;
  workspaceId?: string;
  conversationId?: string;
  payload?: Record<string, unknown>;
  errorMessage: string;
  errorStack?: string;
  attempt: number;
  maxAttempts: number;
}

@Injectable()
export class QueueFailureLogService {
  private readonly logger = new Logger(QueueFailureLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordFailure(input: QueueFailureInput): Promise<void> {
    try {
      await this.prisma.queueFailureLog.create({
        data: {
          queueName: input.queueName,
          jobId: input.jobId,
          workspaceId: input.workspaceId,
          conversationId: input.conversationId,
          payloadJson: input.payload as Prisma.InputJsonValue | undefined,
          errorMessage: input.errorMessage,
          errorStack: input.errorStack,
          attempt: input.attempt,
          maxAttempts: input.maxAttempts,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Queue failure log write failed queue=${input.queueName} jobId=${input.jobId ?? 'unknown'}`,
        error as Error,
      );
    }
  }
}
