import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, QueueEvents, Worker, type JobsOptions } from 'bullmq';
import type IORedis from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import { WhatsAppMessageSenderService } from '../../whatsapp/services/whatsapp-message-sender.service';
import {
  OUTBOUND_MESSAGE_JOB_NAME,
  OUTBOUND_MESSAGE_QUEUE_NAME,
} from '../queue/queue.constants';
import { OutboundMessageQueueJobInput } from '../queue/queue.types';
import { createRedisConnection } from '../queue/redis-connection.util';
import { QueueFailureLogService } from './queue-failure-log.service';

@Injectable()
export class OutboundMessageQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OutboundMessageQueueService.name);
  private queue: Queue<OutboundMessageQueueJobInput, void> | null = null;
  private queueEvents: QueueEvents | null = null;
  private worker: Worker<OutboundMessageQueueJobInput, void> | null = null;
  private redisConnection: IORedis | null = null;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly whatsappMessageSenderService: WhatsAppMessageSenderService,
    private readonly queueFailureLogService: QueueFailureLogService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.appConfigService.queueDriver !== 'bullmq') {
      this.logger.log(
        `Outbound queue initialized in direct mode environment=${this.appConfigService.appEnvironment}`,
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
        'QUEUE_DRIVER=bullmq but REDIS_URL is missing. Falling back to direct outbound send.',
      );
      return;
    }

    this.redisConnection = createRedisConnection(redisUrl);

    const queueName = `${this.appConfigService.queuePrefix}:${OUTBOUND_MESSAGE_QUEUE_NAME}`;

    this.queue = new Queue<OutboundMessageQueueJobInput, void>(queueName, {
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
      this.logger.log('Outbound message queue initialized in producer mode.');
      return;
    }

    this.worker = new Worker<OutboundMessageQueueJobInput, void>(
      queueName,
      async (job) => {
        await this.whatsappMessageSenderService.sendTextMessage({
          workspaceId: job.data.workspaceId,
          to: job.data.to,
          text: job.data.text,
        });
      },
      {
        connection: this.redisConnection,
        concurrency: this.appConfigService.queueOutboundConcurrency,
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
        workspaceId: job.data.workspaceId,
        conversationId: job.data.conversationId,
        payload: job.data as unknown as Record<string, unknown>,
        errorMessage: this.toErrorMessage(error),
        errorStack: error?.stack,
        attempt: job.attemptsMade,
        maxAttempts: Number(job.opts.attempts ?? 1),
      });
    });

    this.logger.log(
      `Outbound message queue worker started queue=${queueName} concurrency=${this.appConfigService.queueOutboundConcurrency}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queueEvents?.close();
    await this.queue?.close();
    await this.redisConnection?.quit();
  }

  async sendText(input: OutboundMessageQueueJobInput): Promise<void> {
    if (!this.queue || !this.queueEvents) {
      await this.whatsappMessageSenderService.sendTextMessage({
        workspaceId: input.workspaceId,
        to: input.to,
        text: input.text,
      });
      return;
    }

    const jobId = this.createJobId(input.conversationId, input.to, input.text);

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

    const job = await this.queue.add(
      OUTBOUND_MESSAGE_JOB_NAME,
      input,
      jobOptions,
    );

    try {
      await job.waitUntilFinished(this.queueEvents, 30000);
    } catch (error: unknown) {
      if (!this.worker && this.appConfigService.nodeEnv !== 'production') {
        this.logger.warn(
          `Outbound queue wait failed jobId=${jobId}. Falling back to direct send in ${this.appConfigService.nodeEnv}.`,
        );

        await this.whatsappMessageSenderService.sendTextMessage({
          workspaceId: input.workspaceId,
          to: input.to,
          text: input.text,
        });
        return;
      }

      throw error;
    }
  }

  private createJobId(
    conversationId: string,
    to: string,
    text: string,
  ): string {
    return `${conversationId}:${to}:${this.hashText(text)}`;
  }

  private hashText(text: string): string {
    let hash = 0;

    for (let index = 0; index < text.length; index += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(index);
      hash |= 0;
    }

    return String(Math.abs(hash));
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'unknown_error';
  }
}
