# Test Architecture (Phase 10)

This repository uses a layered test strategy:

- `unit`: fast business-logic tests (service/policy focused)
- `integration`: module wiring, guards, queue, and cross-service behavior
- `e2e`: HTTP contract and end-to-end flow validation
- `smoke`: minimal release checks for core platform readiness

## Folder structure

```text
test/
  unit/
  integration/
  e2e/
  smoke/
  fixtures/
  helpers/
```

## Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:smoke`
- `npm run test:all`

## Error taxonomy

Tests are grouped to make failures easy to classify:

- config/env errors
- provider errors
- validation errors
- db consistency errors
- auth/tenant isolation errors
- queue/execution errors

## Fixtures and helpers

- `fixtures/`: deterministic seed-like payloads for repeatable scenarios
- `helpers/test-app.factory.ts`: bootstraps a Nest app with overrides
- `helpers/prisma-test.factory.ts`: typed Prisma mock factory
- `helpers/auth-test.helper.ts`: JWT test token generation
- `helpers/queue-test.helper.ts`: queue drain polling utilities
- `helpers/mock-whatsapp.provider.ts`: deterministic WhatsApp fake provider
- `helpers/mock-ai.provider.ts`: deterministic AI fake provider
- `helpers/seed.helper.ts`: reusable in-memory seed builders

## CI note

`npm run test:all` is the intended single command for CI and release gates.
