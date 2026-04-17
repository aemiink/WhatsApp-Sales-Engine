import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, QueueEvents, Worker, type JobsOptions } from 'bullmq';
import type IORedis from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import {
  INBOUND_EXECUTION_JOB_NAME,
  INBOUND_EXECUTION_QUEUE_NAME,
} from '../queue/queue.constants';
import { InboundExecutionJobInput } from '../queue/queue.types';
import { createRedisConnection } from '../queue/redis-connection.util';
import { ExecutionService } from './execution.service';
import { QueueFailureLogService } from './queue-failure-log.service';

interface InboundExecutionMemoryJob extends InboundExecutionJobInput {
  attempt: number;
}

@Injectable()
export class InboundEventQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InboundEventQueueService.name);
  private readonly inFlightJobs = new Set<string>();
  private readonly completedJobs = new Set<string>();
  private readonly failedJobs = new Set<string>();
  private queue: Queue<InboundExecutionJobInput, void> | null = null;
  private queueEvents: QueueEvents | null = null;
  private worker: Worker<InboundExecutionJobInput, void> | null = null;
  private redisConnection: IORedis | null = null;

  constructor(
    private readonly executionService: ExecutionService,
    private readonly appConfigService: AppConfigService,
    private readonly queueFailureLogService: QueueFailureLogService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.appConfigService.queueDriver !== 'bullmq') {
      return;
    }

    const redisUrl = this.appConfigService.redisUrl;
    if (!redisUrl) {
      this.logger.warn(
        'QUEUE_DRIVER=bullmq but REDIS_URL is missing. Falling back to memory inbound queue.',
      );
      return;
    }

    this.redisConnection = createRedisConnection(redisUrl);
    const queueName = `${this.appConfigService.queuePrefix}:${INBOUND_EXECUTION_QUEUE_NAME}`;

    this.queue = new Queue<InboundExecutionJobInput, void>(queueName, {
      connection: this.redisConnection,
    });
    await this.queue.waitUntilReady();

    this.queueEvents = new QueueEvents(queueName, {
      connection: this.redisConnection,
    });
    await this.queueEvents.waitUntilReady();

    const shouldRunWorkers =
      this.appConfigService.queueInlineWorkers ||
      this.appConfigService.appRole === 'worker';

    if (!shouldRunWorkers) {
      this.logger.log('Inbound execution queue initialized in producer mode.');
      return;
    }

    this.worker = new Worker<InboundExecutionJobInput, void>(
      queueName,
      async (job) => {
        await this.executionService.executeForInboundMessage(
          job.data.conversationId,
          job.data.messageId,
        );
      },
      {
        connection: this.redisConnection,
        concurrency: this.appConfigService.queueInboundConcurrency,
      },
    );
    await this.worker.waitUntilReady();

    this.worker.on('active', (job) => {
      const jobId = String(job.id ?? this.createJobIdFromInput(job.data));
      this.inFlightJobs.add(jobId);
    });

    this.worker.on('completed', (job) => {
      const jobId = String(job.id ?? this.createJobIdFromInput(job.data));
      this.inFlightJobs.delete(jobId);
      this.completedJobs.add(jobId);
    });

    this.worker.on('failed', (job, error) => {
      if (!job) {
        return;
      }

      const jobId = String(job.id ?? this.createJobIdFromInput(job.data));
      this.inFlightJobs.delete(jobId);

      const maxAttempts = Number(job.opts.attempts ?? 1);
      if (job.attemptsMade >= maxAttempts) {
        this.failedJobs.add(jobId);
      }

      void this.queueFailureLogService.recordFailure({
        queueName,
        jobId: job.id,
        workspaceId: job.data.workspaceId,
        conversationId: job.data.conversationId,
        payload: job.data as unknown as Record<string, unknown>,
        errorMessage: this.toErrorMessage(error),
        errorStack: error?.stack,
        attempt: job.attemptsMade,
        maxAttempts,
      });
    });

    this.logger.log(
      `Inbound execution queue worker started queue=${queueName} concurrency=${this.appConfigService.queueInboundConcurrency}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queueEvents?.close();
    await this.queue?.close();
    await this.redisConnection?.quit();
  }

  async enqueue(
    input: InboundExecutionJobInput,
  ): Promise<{ queued: true; jobId: string }> {
    const jobId = this.createJobId(input.conversationId, input.messageId);

    if (this.queue && this.queueEvents) {
      const jobOptions: JobsOptions = {
        jobId,
        attempts: this.appConfigService.executionQueueMaxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: this.appConfigService.executionQueueRetryBaseDelayMs,
        },
        removeOnComplete: {
          count: this.appConfigService.queueJobRemoveOnComplete,
        },
        removeOnFail: {
          count: this.appConfigService.queueJobRemoveOnFail,
        },
      };

      await this.queue.add(INBOUND_EXECUTION_JOB_NAME, input, jobOptions);
      this.logger.log(`Queue enqueue inbound execution jobId=${jobId}`);
      return { queued: true, jobId };
    }

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
      failed: this.failedJobs.size,
    };
  }

  private schedule(job: InboundExecutionMemoryJob, delayMs: number) {
    setTimeout(() => {
      void this.process(job);
    }, delayMs);
  }

  private async process(job: InboundExecutionMemoryJob): Promise<void> {
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
        this.failedJobs.add(jobId);
        void this.queueFailureLogService.recordFailure({
          queueName: `${this.appConfigService.queuePrefix}:${INBOUND_EXECUTION_QUEUE_NAME}:memory`,
          jobId,
          workspaceId: job.workspaceId,
          conversationId: job.conversationId,
          payload: job as unknown as Record<string, unknown>,
          errorMessage: this.toErrorMessage(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          attempt: nextAttempt,
          maxAttempts: maxRetries + 1,
        });
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

  private createJobIdFromInput(input: InboundExecutionJobInput): string {
    return this.createJobId(input.conversationId, input.messageId);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'unknown_error';
  }
}
