import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';

function buildCorsOriginChecker(allowedOrigins: string[]) {
  const allowAny = allowedOrigins.includes('*');
  const allowlist = new Set(allowedOrigins);

  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowAny || allowlist.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS policy'));
  };
}

function createMemoryRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyBuilder: (request: Request) => string;
  onLimit: (request: Request, response: Response) => void;
}) {
  const counters = new Map<string, { count: number; windowStartMs: number }>();

  return (request: Request, response: Response, next: NextFunction) => {
    const key = options.keyBuilder(request);
    const now = Date.now();
    const current = counters.get(key);

    if (!current || now - current.windowStartMs >= options.windowMs) {
      counters.set(key, {
        count: 1,
        windowStartMs: now,
      });
      next();
      return;
    }

    if (current.count >= options.maxRequests) {
      options.onLimit(request, response);
      return;
    }

    current.count += 1;
    counters.set(key, current);
    next();
  };
}

async function bootstrap(): Promise<void> {
  const runtimeRole = (process.env.APP_ROLE ?? 'api').trim().toLowerCase();
  if (runtimeRole === 'worker') {
    const workerApp = await NestFactory.createApplicationContext(AppModule);
    const config = workerApp.get(AppConfigService);
    workerApp.enableShutdownHooks();

    Logger.log(
      `Worker runtime started role=${config.appRole} queueDriver=${config.queueDriver}`,
      'Bootstrap',
    );
    return;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const config = app.get(AppConfigService);

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy ? 1 : 0);
  app.use(json({ limit: config.apiRequestBodyLimit }));
  app.use(
    urlencoded({
      extended: true,
      limit: config.apiRequestBodyLimit,
    }),
  );

  app.enableCors({
    origin: buildCorsOriginChecker(config.corsAllowedOrigins),
    credentials: config.corsAllowCredentials,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'X-Requested-With',
      'X-Hub-Signature-256',
    ],
  });

  app.use(
    ['/auth/login', '/auth/refresh'],
    createMemoryRateLimiter({
      windowMs: config.authRateLimitWindowMs,
      maxRequests: config.authRateLimitMaxRequests,
      keyBuilder: (request) => `auth:${request.ip}:${request.path}`,
      onLimit: (_request, response) => {
        response.status(429).json({
          message: 'Too many authentication attempts. Please try again later.',
        });
      },
    }),
  );

  app.use(
    '/webhooks/whatsapp',
    createMemoryRateLimiter({
      windowMs: config.webhookRateLimitWindowMs,
      maxRequests: config.webhookRateLimitMaxRequests,
      keyBuilder: (request) => `webhook:${request.ip}:${request.path}`,
      onLimit: (_request, response) => {
        response.status(429).json({
          message: 'Webhook rate limit exceeded.',
        });
      },
    }),
  );

  if (config.securityHeadersEnabled) {
    app.use((request: Request, response: Response, next: NextFunction) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()',
      );

      if (request.protocol === 'https') {
        response.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
        );
      }

      next();
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (config.nodeEnv !== 'development') {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      release: `whatsapp-sales-engine@${config.appVersion}`,
    });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WhatsApp Sales Engine API')
    .setDescription('Backend API documentation for WhatsApp Sales Engine')
    .setVersion(config.appVersion)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/docs', app, document);

  app.enableShutdownHooks();
  await app.listen(config.port);
}

void bootstrap();
