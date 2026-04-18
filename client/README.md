# WhatsApp Sales Engine Client

React + Vite dashboard for WhatsApp Sales Engine.

## Development

```bash
npm ci
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

## Notes

- Client authentication uses backend `/auth/login`, `/auth/refresh`, `/auth/me`.
- Notifications use authenticated SSE stream with polling fallback.
- Webhook Test page uses real backend `/webhooks/whatsapp/test` endpoint and is expected to be disabled outside dev/test.
