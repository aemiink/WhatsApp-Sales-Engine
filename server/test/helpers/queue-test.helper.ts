import { InboundEventQueueService } from '../../src/execution/services/inbound-event-queue.service';

export async function waitForQueueToDrain(
  queueService: InboundEventQueueService,
  input?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    expectedCompletedDelta?: number;
  },
): Promise<void> {
  const timeoutMs = input?.timeoutMs ?? 1500;
  const pollIntervalMs = input?.pollIntervalMs ?? 10;
  const expectedCompletedDelta = input?.expectedCompletedDelta ?? 1;
  const startedAt = Date.now();
  const initialStats = queueService.getStats();

  while (Date.now() - startedAt < timeoutMs) {
    const stats = queueService.getStats();
    if (
      stats.inFlight === 0 &&
      stats.completed >= initialStats.completed + expectedCompletedDelta
    ) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });
  }

  throw new Error('Queue did not drain before timeout');
}
