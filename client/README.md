# WhatsApp Sales Engine Client

React + Vite dashboard for WhatsApp Sales Engine.

## Setup

```bash
cd client
npm ci
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Environment

Create `client/.env` and set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## CI Notes

Client CI executes real commands:

- `npm run lint` -> ESLint (TypeScript + React hooks rules)
- `npm run test` -> Vitest test suite
- `npm run build` -> production build validation

No fake Playwright or placeholder test step is used.

## Runtime Notes

- Client auth uses backend `/auth/login`, `/auth/refresh`, `/auth/me`.
- Notifications use authenticated SSE stream with polling fallback.
- Webhook Test page uses backend `/webhooks/whatsapp/test`; this endpoint should stay disabled outside dev/test.
