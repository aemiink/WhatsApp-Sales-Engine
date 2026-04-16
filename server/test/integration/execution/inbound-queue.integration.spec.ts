import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../../src/config/app-config.service';
import { ExecutionService } from '../../../src/execution/services/execution.service';
import { InboundEventQueueService } from '../../../src/execution/services/inbound-event-queue.service';
import { waitForQueueToDrain } from '../../helpers/queue-test.helper';

describe('InboundEventQueueService (integration)', () => {
  it('retries failed jobs with backoff and eventually succeeds', async () => {
    let attempt = 0;

    const executionServiceMock = {
      executeForInboundMessage: jest.fn().mockImplementation(() => {
        attempt += 1;

        if (attempt < 2) {
          return Promise.reject(new Error('Transient execution failure'));
        }

        return Promise.resolve({
          decision: {},
          handoff: null,
          reply: {
            sent: false,
            skipped: true,
          },
        });
      }),
    } as Pick<ExecutionService, 'executeForInboundMessage'>;

    const appConfigServiceMock = {
      executionQueueMaxRetries: 2,
      executionQueueRetryBaseDelayMs: 5,
    } as Pick<
      AppConfigService,
      'executionQueueMaxRetries' | 'executionQueueRetryBaseDelayMs'
    >;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        InboundEventQueueService,
        {
          provide: ExecutionService,
          useValue: executionServiceMock,
        },
        {
          provide: AppConfigService,
          useValue: appConfigServiceMock,
        },
      ],
    }).compile();

    const queue = moduleFixture.get(InboundEventQueueService);

    await queue.enqueue({
      workspaceId: 'default-workspace',
      conversationId: 'conv-1',
      messageId: 'msg-1',
    });

    await waitForQueueToDrain(queue, {
      timeoutMs: 500,
      pollIntervalMs: 10,
    });

    expect(executionServiceMock.executeForInboundMessage).toHaveBeenCalledTimes(
      2,
    );
  });

  it('deduplicates same in-flight job id', async () => {
    const executionServiceMock = {
      executeForInboundMessage: jest.fn().mockResolvedValue({
        decision: {},
        handoff: null,
        reply: {
          sent: false,
          skipped: true,
        },
      }),
    } as Pick<ExecutionService, 'executeForInboundMessage'>;

    const appConfigServiceMock = {
      executionQueueMaxRetries: 1,
      executionQueueRetryBaseDelayMs: 5,
    } as Pick<
      AppConfigService,
      'executionQueueMaxRetries' | 'executionQueueRetryBaseDelayMs'
    >;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        InboundEventQueueService,
        {
          provide: ExecutionService,
          useValue: executionServiceMock,
        },
        {
          provide: AppConfigService,
          useValue: appConfigServiceMock,
        },
      ],
    }).compile();

    const queue = moduleFixture.get(InboundEventQueueService);

    await Promise.all([
      queue.enqueue({
        workspaceId: 'default-workspace',
        conversationId: 'conv-2',
        messageId: 'msg-2',
      }),
      queue.enqueue({
        workspaceId: 'default-workspace',
        conversationId: 'conv-2',
        messageId: 'msg-2',
      }),
    ]);

    await waitForQueueToDrain(queue, {
      timeoutMs: 500,
      pollIntervalMs: 10,
    });

    expect(executionServiceMock.executeForInboundMessage).toHaveBeenCalledTimes(
      1,
    );
  });
});
