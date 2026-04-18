import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Event } from '@sentry/node';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';

interface CaptureExceptionInput {
  request?: Request;
  statusCode?: number;
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
}

interface RequestUserContext {
  userId?: string;
  email?: string;
  workspaceId?: string;
  role?: string;
}

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|api[-_]?key|refresh|access)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth >= 4) {
    return '[TRUNCATED]';
  }

  if (Array.isArray(value)) {
    return value.slice(0, 40).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (isRecord(value)) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value).slice(0, 80)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = REDACTED;
        continue;
      }

      sanitized[key] = sanitizeValue(entry, depth + 1);
    }

    return sanitized;
  }

  if (typeof value === 'string') {
    if (value.length > 1500) {
      return `${value.slice(0, 1500)}...[TRUNCATED]`;
    }

    if (value.toLowerCase().startsWith('bearer ')) {
      return REDACTED;
    }

    return value;
  }

  return value;
}

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  constructor(private readonly appConfigService: AppConfigService) {}

  onModuleInit(): void {
    const enabled = this.appConfigService.sentryEnabled;
    const dsn = this.appConfigService.sentryDsn;

    if (!enabled) {
      this.logger.log('Sentry is disabled by configuration.');
      return;
    }

    if (!dsn) {
      this.logger.warn('Sentry is enabled but SENTRY_DSN is missing.');
      return;
    }

    Sentry.init({
      dsn,
      environment: this.appConfigService.appEnvironment,
      release: this.appConfigService.appVersion,
      sendDefaultPii: false,
      beforeSend: (event) => this.scrubEvent(event),
    });

    this.initialized = true;
    this.logger.log('Sentry SDK initialized.');
  }

  isEnabled(): boolean {
    return this.initialized;
  }

  captureException(
    exception: unknown,
    input: CaptureExceptionInput = {},
  ): void {
    if (!this.initialized) {
      return;
    }

    Sentry.withScope((scope) => {
      if (input.statusCode) {
        scope.setTag('http.status_code', String(input.statusCode));
      }

      for (const [key, value] of Object.entries(input.tags ?? {})) {
        scope.setTag(key, value);
      }

      if (input.request) {
        const user = this.extractUserContext(input.request);

        if (user.userId) {
          scope.setUser({
            id: user.userId,
            email: user.email,
          });
        }

        if (user.workspaceId) {
          scope.setTag('workspace.id', user.workspaceId);
        }

        if (user.role) {
          scope.setTag('workspace.role', user.role);
        }

        scope.setContext('request', this.buildRequestContext(input.request));
      }

      if (input.extras) {
        scope.setExtras(sanitizeValue(input.extras) as Record<string, unknown>);
      }

      Sentry.captureException(exception);
    });
  }

  private extractUserContext(request: Request): RequestUserContext {
    const user = (request as Request & { user?: unknown }).user;
    if (!isRecord(user)) {
      return {};
    }

    return {
      userId: typeof user.userId === 'string' ? user.userId : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
      workspaceId:
        typeof user.workspaceId === 'string' ? user.workspaceId : undefined,
      role: typeof user.role === 'string' ? user.role : undefined,
    };
  }

  private buildRequestContext(request: Request): Record<string, unknown> {
    return {
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      params: sanitizeValue(request.params),
      query: sanitizeValue(request.query),
      headers: sanitizeValue(request.headers),
      body: sanitizeValue(request.body),
    };
  }

  private scrubEvent<T extends Event>(event: T): T {
    if (event.request) {
      event.request.headers = sanitizeValue(event.request.headers) as
        | Record<string, string>
        | undefined;
      event.request.data = sanitizeValue(event.request.data);
      event.request.cookies = sanitizeValue(event.request.cookies) as
        | Record<string, string>
        | undefined;
    }

    event.extra = sanitizeValue(event.extra) as Record<string, unknown>;
    event.contexts = sanitizeValue(event.contexts) as Event['contexts'];

    return event;
  }
}
