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

Current client scripts are intentionally explicit:

- `npm run lint` -> placeholder output (no dedicated lint framework configured yet)
- `npm run test` -> placeholder output (no automated client test suite configured yet)
- `npm run build` -> real production build check

CI reflects this honestly and does not fake Playwright/test execution.

## Runtime Notes

- Client auth uses backend `/auth/login`, `/auth/refresh`, `/auth/me`.
- Notifications use authenticated SSE stream with polling fallback.
- Webhook Test page uses backend `/webhooks/whatsapp/test`; this endpoint should stay disabled outside dev/test.
