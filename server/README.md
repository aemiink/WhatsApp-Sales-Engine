# WhatsApp Sales Engine Server

Production-oriented NestJS backend for multi-tenant WhatsApp sales automation.

## Requirements

- Node.js 22+
- PostgreSQL (Supabase supported)
- Redis (required for `bullmq` queue driver in staging/production)

## Setup

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

## Core Environment Variables

Copy `server/.env.example` to `server/.env` and configure at least:

- `DATABASE_URL`: runtime database URL
- `DIRECT_URL`: migration URL
- `SECRET_ENCRYPTION_KEY`: base64 key, must decode to 32 bytes (AES-256-GCM)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `AI_DEFAULT_PROVIDER` + provider key (`GEMINI_API_KEY` or `OPENAI_API_KEY`)

### Environment behavior

- `APP_ENVIRONMENT=development|test|staging|production`
- In `staging/production`:
  - `QUEUE_DRIVER` must be `bullmq`
  - `REDIS_URL` is required
  - `WHATSAPP_ENV_FALLBACK_ENABLED` must be `false`
  - `INSTAGRAM_ENV_FALLBACK_ENABLED` must be `false`
  - `WEBHOOK_TEST_TOOL_ENABLED` must be `false`

## Queue and Worker

Two runtime roles are supported:

- API: `npm run start:dev` (or `npm run start`)
- Worker: `npm run build && npm run start:worker`

Queue settings:

- `QUEUE_DRIVER=memory|bullmq`
- `QUEUE_INLINE_WORKERS=true|false`
- `QUEUE_PREFIX`, concurrency and retry options in `.env.example`

Production-like environments fail fast when queue config is invalid (for example missing Redis while using BullMQ).

## Auth and Sessions

- Login: `POST /auth/login`
- Refresh: `POST /auth/refresh`
- Current user: `GET /auth/me`
- Admin session management: `GET /sessions`, `DELETE /sessions/:tokenId`, `POST /sessions/revoke-all`

Session revocation is persisted in database (`auth_sessions`) and survives restarts/multi-instance deployments.

## WhatsApp and Instagram source resolution

- WhatsApp connection resolution is workspace-first (DB), optional env fallback in development.
- Instagram source resolution is workspace-first (`instagram_connections`), optional env fallback in development.
- Access tokens are encrypted at rest via AES-256-GCM.

## Swagger / OpenAPI

Swagger UI is available when enabled:

- `SWAGGER_ENABLED=true`
- `SWAGGER_PATH=docs`

Default URL: `http://localhost:3000/docs`

## Sentry

Configure:

- `SENTRY_ENABLED=true`
- `SENTRY_DSN=https://...`

Server exceptions are captured through a global filter. Request context is sanitized and sensitive keys (token/secret/password/cookie/auth headers) are scrubbed.

## Test Commands

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:smoke
```
