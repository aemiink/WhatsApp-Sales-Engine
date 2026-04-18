# WhatsApp Sales Engine Server

Multi-tenant NestJS backend for WhatsApp Sales Engine.  
Core responsibilities: auth/session, conversation lifecycle, AI execution flow, analytics, notifications, and integration endpoints.

## Project Purpose

- Manage WhatsApp conversations per workspace (tenant-safe).
- Execute AI-assisted reply and handoff flows.
- Provide analytics, notifications, and operational APIs.
- Run safely in production with strict env validation and fail-fast behavior.

## Installation

```bash
cd server
npm ci
npm run prisma:generate
```

## Environment Variables

1. Copy `.env.example` to `.env`.
2. Configure required secrets and connection URLs.

Minimum required variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `SECRET_ENCRYPTION_KEY` (base64, decodes to exactly 32 bytes)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `AI_DEFAULT_PROVIDER` + provider API key

Important behavior flags:

- `APP_ENVIRONMENT=development|test|staging|production`
- `SENTRY_ENABLED`, `SENTRY_DSN`
- `SWAGGER_ENABLED`, `SWAGGER_PATH`
- `WHATSAPP_ENV_FALLBACK_ENABLED`
- `INSTAGRAM_ENV_FALLBACK_ENABLED`
- `WEBHOOK_TEST_TOOL_ENABLED`

## Prisma / Database

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

- Runtime DB uses `DATABASE_URL`.
- Migrations use `DIRECT_URL`.
- Session revocation is persisted in `auth_sessions`.
- Instagram workspace source mapping is persisted in `instagram_connections`.

## Auth

Primary endpoints:

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`

Session control endpoints:

- `GET /sessions`
- `DELETE /sessions/:tokenId`
- `POST /sessions/revoke-all`

Session revocation is persistent (DB-backed), restart-safe, and suitable for multi-instance deployments.

## Worker / Queue

Queue modes:

- `QUEUE_DRIVER=memory` for local development only
- `QUEUE_DRIVER=bullmq` for staging/production

Worker runtime:

```bash
npm run build
npm run start:worker
```

Production-like environments fail fast when queue config is invalid (for example BullMQ selected but Redis missing).

## Webhook

Public Meta webhook endpoints:

- `GET /webhooks/whatsapp` (verification)
- `POST /webhooks/whatsapp` (ingestion)

Internal developer test endpoint:

- `POST /webhooks/whatsapp/test` (admin-only)

`/webhooks/whatsapp/test` must stay disabled in staging/production via `WEBHOOK_TEST_TOOL_ENABLED=false`.

## Swagger

Swagger/OpenAPI is configured in bootstrap.

- `SWAGGER_ENABLED=true|false`
- `SWAGGER_PATH=docs` (default)

Default URL:

- `http://localhost:3000/docs`

Bearer auth schema is defined and main modules are tagged.

## Sentry

Sentry is integrated through startup + global exception filtering.

- `SENTRY_ENABLED=true`
- `SENTRY_DSN=<dsn>`

Behavior:

- Enabled conditionally by env.
- Captures server exceptions.
- Adds request/workspace/user context.
- Scrubs sensitive keys (tokens, secrets, passwords, auth headers, cookies).

## Test Commands

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:smoke
```

## Development vs Production Notes

Development defaults optimize local ergonomics:

- `QUEUE_DRIVER=memory`
- env fallback can be enabled for WhatsApp/Instagram
- webhook test tool can stay enabled

Production/staging should enforce operational safety:

- `QUEUE_DRIVER=bullmq`
- `REDIS_URL` required
- WhatsApp/Instagram source resolution should be DB-first (`*_ENV_FALLBACK_ENABLED=false`)
- webhook test tool disabled
- Sentry enabled with valid DSN
