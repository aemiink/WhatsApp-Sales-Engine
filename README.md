# WhatsApp Sales Engine

Monorepo for a multi-tenant WhatsApp sales automation platform.

## Projects

- `server/`: NestJS backend (auth, conversations, execution engine, analytics, notifications, WhatsApp integrations)
- `client/`: React + Vite dashboard

## Quick Start

### 1) Server

```bash
cd server
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

### 2) Client

```bash
cd client
npm ci
npm run dev
```

Client default URL: `http://localhost:5173`  
Server default URL: `http://localhost:3000`

## Common Commands

### Server

- `npm run lint`
- `npm run test:all`
- `npm run build`
- `npm run start:worker`

### Client

- `npm run dev`
- `npm run build`
- `npm run lint`

## Architecture Summary

- **Auth + Session**: JWT access/refresh with persistent session revocation (`auth_sessions`).
- **Multi-tenancy**: Workspace-scoped data isolation across conversations, analytics, notifications, brand context.
- **Execution Pipeline**: Inbound webhook -> queue -> AI decision -> outbound/handoff flows.
- **Queue**: `memory` for local development, `bullmq + redis` for production-like environments.
- **Security hardening**:
  - AES-256-GCM encrypted secret storage for integration tokens
  - strict environment validation rules
  - production-safe fallback controls
  - optional Sentry integration with sensitive-data scrubbing
- **Observability**: health/version endpoints, queue failure logging, Swagger docs.

## API Docs

When enabled on server:

- Swagger UI: `http://localhost:3000/docs`

## CI

GitHub Actions validates:

- server tests
- client build/lint/test workflow
