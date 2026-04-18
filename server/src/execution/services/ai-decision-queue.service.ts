import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, QueueEvents, Worker, type JobsOptions } from 'bullmq';
import type IORedis from 'ioredis';
import { SalesEngineService } from '../../sales-engine/sales-engine.service';
import { FinalSalesDecision } from '../../sales-engine/types/final-sales-decision.types';
import { AppConfigService } from '../../config/app-config.service';
import {
  AI_DECISION_JOB_NAME,
  AI_DECISION_QUEUE_NAME,
} from '../queue/queue.constants';
import { AiDecisionQueueJobInput } from '../queue/queue.types';
import { createRedisConnection } from '../queue/redis-connection.util';
import { QueueFailureLogService } from './queue-failure-log.service';

@Injectable()
export class AiDecisionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiDecisionQueueService.name);
  private queue: Queue<AiDecisionQueueJobInput, FinalSalesDecision> | null =
    null;
  private queueEvents: QueueEvents | null = null;
  private worker: Worker<AiDecisionQueueJobInput, FinalSalesDecision> | null =
    null;
  private redisConnection: IORedis | null = null;

  constructor(
    private readonly salesEngineService: SalesEngineService,
    private readonly appConfigService: AppConfigService,
    private readonly queueFailureLogService: QueueFailureLogService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.appConfigService.queueDriver !== 'bullmq') {
      this.logger.log(
        `AI decision queue initialized in direct mode environment=${this.appConfigService.appEnvironment}`,
      );
      return;
    }

    const redisUrl = this.appConfigService.redisUrl;
    if (!redisUrl) {
      if (this.appConfigService.isProductionLike) {
        throw new Error(
          'QUEUE_DRIVER=bullmq requires REDIS_URL in production-like environments.',
        );
      }

      this.logger.warn(
        'QUEUE_DRIVER=bullmq but REDIS_URL is missing. Falling back to direct execution.',
      );
      return;
    }

    this.redisConnection = createRedisConnection(redisUrl);

    const queueName = `${this.appConfigService.queuePrefix}:${AI_DECISION_QUEUE_NAME}`;

    this.queue = new Queue<AiDecisionQueueJobInput, FinalSalesDecision>(
      queueName,
      {
        connection: this.redisConnection,
      },
    );
    await this.queue.waitUntilReady();

    this.queueEvents = new QueueEvents(queueName, {
      connection: this.redisConnection,
    });
    await this.queueEvents.waitUntilReady();

    const shouldRunWorkers =
      this.appConfigService.queueInlineWorkers ||
      this.appConfigService.appRole === 'worker';

    if (!shouldRunWorkers) {
      this.logger.log('AI decision queue initialized in producer mode.');
      return;
    }

    this.worker = new Worker<AiDecisionQueueJobInput, FinalSalesDecision>(
      queueName,
      async (job) => {
        return this.salesEngineService.generateDecision({
          conversationId: job.data.conversationId,
          messageId: job.data.messageId,
        });
      },
      {
        connection: this.redisConnection,
        concurrency: this.appConfigService.queueAiDecisionConcurrency,
      },
    );
    await this.worker.waitUntilReady();

    this.worker.on('failed', (job, error) => {
      if (!job) {
        return;
      }

      void this.queueFailureLogService.recordFailure({
        queueName,
        jobId: job.id,
        conversationId: job.data.conversationId,
        payload: job.data as unknown as Record<string, unknown>,
        errorMessage: this.toErrorMessage(error),
        errorStack: error?.stack,
        attempt: job.attemptsMade,
        maxAttempts: Number(job.opts.attempts ?? 1),
      });
    });

    this.logger.log(
      `AI decision queue worker started queue=${queueName} concurrency=${this.appConfigService.queueAiDecisionConcurrency}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queueEvents?.close();
    await this.queue?.close();
    await this.redisConnection?.quit();
  }

  async generateDecision(input: {
    conversationId: string;
    messageId: string;
  }): Promise<FinalSalesDecision> {
    if (!this.queue || !this.queueEvents) {
      return this.salesEngineService.generateDecision({
        conversationId: input.conversationId,
        messageId: input.messageId,
      });
    }

    const jobId = this.createJobId(input.conversationId, input.messageId);

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

    const job = await this.queue.add(AI_DECISION_JOB_NAME, input, jobOptions);

    try {
      return await job.waitUntilFinished(this.queueEvents, 30000);
    } catch (error: unknown) {
      if (!this.worker && this.appConfigService.nodeEnv !== 'production') {
        this.logger.warn(
          `AI decision queue wait failed jobId=${jobId}. Falling back to direct execution in ${this.appConfigService.nodeEnv}.`,
        );
        return this.salesEngineService.generateDecision({
          conversationId: input.conversationId,
          messageId: input.messageId,
        });
      }

      throw error;
    }
  }

  private createJobId(conversationId: string, messageId: string): string {
    return `${conversationId}:${messageId}`;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'unknown_error';
  }
}
