# TMS — Coding Conventions

This document defines the coding style, patterns, and naming rules for the TMS project. These are enforced by the `tms-conventions` Cursor rule in every session.

---

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Backend source files | `kebab-case.ts` | `ticket-service.ts`, `error-handler.ts` |
| Backend validators | `<entity>.validator.ts` | `ticket.validator.ts` |
| Backend routes | `<entity>.router.ts` | `ticket.router.ts` |
| Backend repositories | `<entity>.repository.ts` | `ticket.repository.ts` |
| Frontend components | `PascalCase.tsx` | `TicketDetail.tsx`, `StatusBadge.tsx` |
| Frontend hooks | `use<Name>.ts` | `useTickets.ts`, `useTicketDetail.ts` |
| Frontend API modules | `<entity>.api.ts` | `tickets.api.ts` |
| Test files | `<name>.test.ts` | `ticket-status.test.ts` |

---

## TypeScript

- **Strict mode on** (`"strict": true`) in both `frontend/tsconfig.json` and `backend/tsconfig.json`
- **No `any`** without a justification comment on the same line: `// any: third-party lib has no types`
- **Explicit return types** on all exported functions and class methods
- **`interface`** for objects that can be extended; **`type`** for unions and intersections
- Use **path aliases** instead of relative `../../..` imports:
  - Backend: `@/services/ticket-service`
  - Frontend: `@/components/TicketCard`

---

## API Response Envelope

Every response — success or error — uses this shape. No exceptions.

```typescript
// Success response
type ApiSuccess<T> = {
  data: T;
  meta?: { total: number };
};

// Error response
type ApiError = {
  error: {
    code: string;      // Machine-readable: "INVALID_TRANSITION", "VALIDATION_ERROR", "NOT_FOUND"
    message: string;   // Human-readable: "Cannot move from Open to Closed"
  };
};
```

### HTTP status codes

| Code | Meaning | When to use |
|------|---------|------------|
| `200` | OK | Successful GET/PATCH/DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Input validation failure (Zod error) |
| `404` | Not Found | Resource does not exist |
| `422` | Unprocessable Entity | Business rule violation (invalid state transition) |
| `500` | Internal Server Error | Unhandled unexpected error |

---

## Error Handling

```typescript
// ❌ Never silently swallow errors
try {
  await doThing();
} catch (e) {}

// ❌ Never log and swallow
try {
  await doThing();
} catch (e) {
  console.error(e);
}

// ✅ Propagate with context — let the central handler format the response
try {
  await doThing();
} catch (e) {
  throw new ServiceError('Failed to update ticket status', { cause: e });
}
```

All errors flow to `backend/src/middleware/error-handler.ts`. Route handlers must not catch and format errors — they propagate with `next(error)`.

---

## Validation

```typescript
// In validators/ticket.validator.ts
export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTo: z.string().uuid().optional(),
  createdBy: z.string().uuid(),
});
```

```typescript
// In routes/ticket.router.ts — validate before the handler runs
router.post('/', validate(createTicketSchema), ticketController.create);
```

Backend always re-validates. Frontend validation is UX only — never security.

---

## Imports

Group in this order, separated by a blank line:

```typescript
// 1. External packages
import express from 'express';
import { z } from 'zod';

// 2. Internal modules
import { TicketService } from '@/services/ticket-service';
import { validate } from '@/middleware/validate';

// 3. Types only
import type { CreateTicketDto, TicketStatus } from '@/types';
```

---

## Prisma & Database

- Schema column names: `snake_case` (Prisma maps to `camelCase` in TypeScript via `@map`)
- All Prisma client calls go in `backend/src/repositories/` — nowhere else
- Repository functions are always async and return typed results
- Never expose raw Prisma models at API boundaries — map to response DTOs

---

## Environment Variables

- `.env` — local environment, **gitignored**, never committed
- `.env.example` — template with placeholder values, **committed**, kept in sync
- Access via a validated config module (`backend/src/config.ts`) — never `process.env` scattered in code:

```typescript
// backend/src/config.ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const config = schema.parse(process.env);
```

---

## React Conventions

- **Functional components only** — no class components
- **Custom hooks** for any non-trivial stateful logic — keep components lean
- **Error boundaries** around ticket views — unexpected errors must not crash the whole app
- **Loading and error states** are first-class — every async operation shows feedback
- Co-locate styles with components (CSS modules or Tailwind classes, decided during setup)
