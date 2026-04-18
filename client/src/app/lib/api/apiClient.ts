import { tokenStorage, type StoredTokens } from '../auth/tokenStorage';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const DEFAULT_RATE_LIMIT = 100;

function checkRateLimit(key: string, limit: number = DEFAULT_RATE_LIMIT): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  rateLimits.set(key, entry);
  return true;
}

export function createRateLimitedFetcher(maxRequestsPerMinute: number = DEFAULT_RATE_LIMIT) {
  return async function rateLimitedFetch<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    if (!checkRateLimit(path, maxRequestsPerMinute)) {
      throw new ApiError(429, 'Rate limit exceeded. Please try again later.', null);
    }
    return apiRequest<T>(path, options);
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

type UnauthorizedHandler = () => void;
type TokenUpdateHandler = (tokens: StoredTokens) => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let onTokensRefreshed: TokenUpdateHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export function setTokensRefreshedHandler(handler: TokenUpdateHandler | null): void {
  onTokensRefreshed = handler;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<StoredTokens | null> | null = null;

async function performRefresh(): Promise<StoredTokens | null> {
  const current = tokenStorage.read();
  if (!current) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clear();
      return null;
    }

    const data = (await response.json()) as RefreshResponse;
    const fresh: StoredTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    tokenStorage.write(fresh);
    onTokensRefreshed?.(fresh);
    return fresh;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

function ensureRefresh(): Promise<StoredTokens | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text.length === 0 ? null : text;
}

function buildHeaders(
  options: ApiRequestOptions,
  token: string | null,
  hasBody: boolean,
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const tokens = tokenStorage.read();
  const body =
    options.body === undefined
      ? undefined
      : typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers: buildHeaders(options, tokens?.accessToken ?? null, body !== undefined),
  });

  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options.skipRefresh &&
    tokens
  ) {
    const refreshed = await ensureRefresh();
    if (!refreshed) {
      onUnauthorized?.();
      throw new ApiError(401, 'Unauthorized', null);
    }

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      body,
      headers: buildHeaders(options, refreshed.accessToken, body !== undefined),
    });

    if (retryResponse.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, 'Unauthorized', null);
    }

    return finalize<T>(retryResponse);
  }

  return finalize<T>(response);
}

async function finalize<T>(response: Response): Promise<T> {
  const data = await parseResponse(response);
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message ?? response.statusText)
        : response.statusText;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}
