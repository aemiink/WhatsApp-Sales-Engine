import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { ExecutionService } from './execution.service';

interface InboundExecutionJob {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  attempt: number;
}

@Injectable()
export class InboundEventQueueService {
  private readonly logger = new Logger(InboundEventQueueService.name);
  private readonly inFlightJobs = new Set<string>();
  private readonly completedJobs = new Set<string>();

  constructor(
    private readonly executionService: ExecutionService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async enqueue(input: {
    workspaceId: string;
    conversationId: string;
    messageId: string;
  }): Promise<{ queued: true; jobId: string }> {
    const jobId = this.createJobId(input.conversationId, input.messageId);

    if (this.completedJobs.has(jobId)) {
      this.logger.log(`Queue dedup skip completed jobId=${jobId}`);
      return { queued: true, jobId };
    }

    if (this.inFlightJobs.has(jobId)) {
      this.logger.log(`Queue dedup skip in-flight jobId=${jobId}`);
      return { queued: true, jobId };
    }

    this.schedule(
      {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        attempt: 0,
      },
      0,
    );

    this.logger.log(`Queue enqueue inbound execution jobId=${jobId}`);
    return { queued: true, jobId };
  }

  getStats() {
    return {
      inFlight: this.inFlightJobs.size,
      completed: this.completedJobs.size,
    };
  }

  private schedule(job: InboundExecutionJob, delayMs: number) {
    setTimeout(() => {
      void this.process(job);
    }, delayMs);
  }

  private async process(job: InboundExecutionJob): Promise<void> {
    const jobId = this.createJobId(job.conversationId, job.messageId);

    if (this.completedJobs.has(jobId)) {
      return;
    }

    this.inFlightJobs.add(jobId);

    try {
      await this.executionService.executeForInboundMessage(
        job.conversationId,
        job.messageId,
      );

      this.completedJobs.add(jobId);
      this.logger.log(`Queue processed inbound execution jobId=${jobId}`);
    } catch (error: unknown) {
      const nextAttempt = job.attempt + 1;
      const maxRetries = this.appConfigService.executionQueueMaxRetries;

      if (nextAttempt <= maxRetries) {
        const delay =
          this.appConfigService.executionQueueRetryBaseDelayMs *
          2 ** job.attempt;

        this.logger.warn(
          `Queue retry scheduled jobId=${jobId} attempt=${nextAttempt}/${maxRetries} delayMs=${delay}`,
        );

        this.schedule(
          {
            ...job,
            attempt: nextAttempt,
          },
          delay,
        );
      } else {
        this.logger.error(
          `Queue failed jobId=${jobId} attempts=${nextAttempt}`,
          error as Error,
        );
      }
    } finally {
      this.inFlightJobs.delete(jobId);
    }
  }

  private createJobId(conversationId: string, messageId: string): string {
    return `${conversationId}:${messageId}`;
  }
}
