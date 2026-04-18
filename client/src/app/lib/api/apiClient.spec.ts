import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createRateLimitedFetcher } from './apiClient';

describe('createRateLimitedFetcher', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws 429 when the same path exceeds per-minute limit', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    ) as unknown as typeof fetch;

    const fetcher = createRateLimitedFetcher(1);

    await expect(fetcher('/rate-limit-check', { skipAuth: true })).resolves.toEqual({
      ok: true,
    });

    await expect(fetcher('/rate-limit-check', { skipAuth: true })).rejects.toMatchObject<
      Partial<ApiError>
    >({
      status: 429,
    });
  });
});
