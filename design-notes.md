# Design Notes

> The design of the system and the reasoning behind it. The full running log of decisions with alternatives-rejected lives in `docs/design-decisions.md` (DD-1…DD-20); this document is the consolidated, submission-facing narrative.

---

## Architecture Overview (frontend, backend, database)

```
┌──────────────────────────┐        HTTP / JSON        ┌───────────────────────────────┐
│         Frontend         │  ──────────────────────▶  │            Backend            │
│  React 19 + Vite + TS    │   envelope: { data } /    │   Node + Express 5 + TS       │
│                          │   { error:{code,message}} │                               │
│  pages → hooks → api     │  ◀──────────────────────  │  routes → services → repos    │
│  (native fetch client)   │                           │                               │
└──────────────────────────┘                           └───────────────┬───────────────┘
        Vite dev proxy                                                  │ Prisma 7
        /api/* → :3000                                                  ▼  (@prisma/adapter-pg)
                                                              ┌───────────────────────────┐
                                                              │        PostgreSQL         │
                                                              │  users · tickets · comments│
                                                              └───────────────────────────┘
```

**Guiding principles**
- **Single source of truth for business rules is the backend.** The frontend may mirror rules for UX but never enforces them.
- **Strict layering with hard boundaries.** DB access only in repositories; business logic only in services; routes are thin (validate → delegate → respond).
- **One consistent contract.** Every response uses the same envelope, every error flows through one handler, every request is validated by Zod before a handler runs.
- **Minimal dependencies.** No axios, no React Query, no state-machine library — deliberately kept small (DD-3/8/15).

---

## Frontend Design

**Stack & structure.** React 19 + Vite + TypeScript (strict). `pages/` compose `hooks/`; hooks call the typed `api/` client; the API layer never lives inside components. This keeps loading/error handling and fetch logic out of the view layer (DD-15).

```
frontend/src/
├── pages/       TicketListPage · CreateTicketPage · TicketDetailPage
├── components/  TicketCard · StatusBadge · StatusControl · CommentThread · ErrorMessage · UserSelect
├── hooks/       useTickets · useTicketDetail · useUsers · useMutation
├── api/         client.ts (fetchJson) · tickets.api.ts · users.api.ts
├── lib/         status-transitions.ts  (UX mirror of the backend map)
└── types/       shared types + ApiClientError
```

**Key UX decisions**
- **Ticket list = compact rows** (not a dense table, not a big-card grid) — scannable and mobile-friendly while keeping a meaningful `TicketCard` component (DD-16).
- **Detail = split layout** — a main column for field edits + comments, and a side panel dedicated to current status + `StatusControl`. Isolating the highest-judgment interaction (status change) makes the state machine visible (DD-18).
- **`StatusControl` only offers valid next states.** It reads `getNextStatuses(current)` from `lib/status-transitions.ts`, a mirror of the backend map. This is UX only — the backend still re-validates (DD-3).
- **No global "current user".** `createdBy`/author is chosen per form via `UserSelect` over seeded users, rather than a fake global session that would imply incomplete auth (DD-17).
- **Native `fetch` over axios** — a thin typed wrapper gives the same DX without the bundle cost (DD-8).

**Data client.** `fetchJson<T>` sets `Content-Type` only when there is a body, unwraps `{ data }` on success, and on failure throws a typed `ApiClientError(code, message, status)`. It also flattens Zod per-field `details` into a readable message (e.g. `title: Title is required`) rather than the generic "Validation failed" (DD-20), and converts a thrown/`fetch` failure into a friendly `NETWORK_ERROR`.

---

## Backend Design

**Three-layer architecture (enforced by a Cursor rule):**

| Layer | Responsibility | May depend on |
|-------|----------------|---------------|
| `routes/` | Validate request (Zod middleware) → call a service → shape the envelope. Zero domain logic. | services, validators |
| `services/` | All business logic, including the **state machine**. Throws typed errors. | repositories, errors |
| `repositories/` | The **only** place Prisma is used. Pure data access + search/filter SQL. | Prisma client |

Cross-cutting: `middleware/validate.ts` (Zod), `middleware/error-handler.ts` (central envelope errors), `errors.ts` (`ServiceError`, `NotFoundError`, `InvalidTransitionError`), `config.ts` (Zod-validated env), `db.ts` (singleton `PrismaClient` via `@prisma/adapter-pg`).

**The state machine (the centrepiece).** A static map from current status to allowed next statuses lives in `ticket.service.ts` — explicit, readable, testable, and easy to extend:

```typescript
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED", "CANCELLED"],
  RESOLVED:    ["CLOSED"],
  CLOSED:      [],
  CANCELLED:   [],
};
```

`changeStatus(id, newStatus)` loads the ticket (404 if missing), checks membership in the allowed list, and either updates via the repository or throws `InvalidTransitionError`, which the central handler renders as **422** `INVALID_TRANSITION`. A state-machine *library* (e.g. XState) was rejected as overkill for five states (DD-3).

**Why 422, not 400 or 500.** The request is syntactically valid (it passed Zod), so it is not a 400; it is not an unexpected server fault, so it is not a 500. It is a well-formed request that violates a domain rule → "Unprocessable Entity" = 422.

**Tooling decisions forced by bleeding-edge versions** (all documented as design decisions):
- Prisma 7's `prisma-client` generator outputs to `src/generated/prisma`, and the client now requires a driver adapter — hence `@prisma/adapter-pg` + `pg.Pool` (DD-12/13).
- `ts-node` is incompatible with TypeScript 7, so `tsx` (esbuild-backed) runs the dev server and seed (DD-14).
- Express 5 exposes `req.query`/`req.params` as getter-only, so validated values are re-attached via `Object.defineProperty` instead of assignment (DD-19).

---

## Database Design

**Engine:** PostgreSQL. **Access:** Prisma (schema, migrations, type-safe queries). Chosen over SQLite (Postgres `ILIKE` search is cleaner and more production-realistic) and MongoDB (the data is clearly relational) — see DD-1.

**Entities & relationships**

```
User (1) ───< (N) Ticket        Ticket.createdById  → User.id   (required)
User (1) ───< (N) Ticket        Ticket.assignedToId → User.id   (nullable)
Ticket (1) ─< (N) Comment       Comment.ticketId    → Ticket.id (onDelete: Cascade)
User (1) ───< (N) Comment       Comment.createdById → User.id   (required)
```

**Conventions**
- Model fields are camelCase (`createdById`, `assignedToId`, `ticketId`); DB columns are snake_case via `@map("created_by")` etc. The `<relation>Id` suffix keeps the scalar FK distinct from the relation object and is Prisma-idiomatic (DD-10).
- Enums live in the schema: `Role (AGENT|ADMIN)`, `Priority (LOW|MEDIUM|HIGH|CRITICAL)`, `TicketStatus (OPEN|IN_PROGRESS|RESOLVED|CLOSED|CANCELLED)` with `status` defaulting to `OPEN`.
- `Comment` cascades on ticket deletion — orphaned comments are meaningless (DD-11).
- IDs are `cuid()` strings; `createdAt`/`updatedAt` are managed by Prisma (`@default(now())`, `@updatedAt`).

**Seed.** Fictional-only data (`@example.com`) — 3 users (1 ADMIN, 2 AGENT), 6 tickets across several statuses, 5 comments (R-SEC-2, no real PII).

**Persistence guarantee (NF1).** All state lives in Postgres; nothing is held in memory. Verified by restarting the backend and confirming tickets/comments remain (Phase 4 evidence in `docs/debugging-log.md`).

---

## Validation Strategy

- **Zod schemas in `validators/`**, applied by `middleware/validate.ts` *before* the handler runs, so handlers receive fully-typed, safe data. Zod also *infers* the DTO types — one source of truth for validation and types (DD-5).
- **Backend always re-validates.** Frontend validation is additive UX only and never trusted (NF2).
- **Schemas:** `createTicketSchema` (title 1–255 required, priority enum required, `createdById` required, description/assignee optional), `updateTicketSchema` (all optional but refined to require ≥1 field, nullable description/assignee to allow clearing), `changeStatusSchema` (status enum), `ticketQuerySchema` (optional search + status), `createCommentSchema` (message + `createdById`, both non-empty).
- **Boundary discipline:** an unknown status string fails the Zod enum → **400**, *before* the state machine ever runs; only a well-formed-but-illegal transition reaches the state machine → **422**. This 400/422 split is asserted by a dedicated test.

---

## Error Handling Strategy

- **Typed errors** (`errors.ts`): `ServiceError(message, code, statusCode)` is the base; `NotFoundError` → 404 `NOT_FOUND`; `InvalidTransitionError` → 422 `INVALID_TRANSITION` with message `Cannot transition from X to Y`.
- **Central handler** (`middleware/error-handler.ts`): `ServiceError` instances render as `{ error: { code, message } }` with their status; anything else becomes `500 { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }` so internals never leak.
- **Routes never catch locally.** Each handler wraps its logic in `try/catch` only to call `next(err)`, keeping error shaping in exactly one place (per `CONVENTIONS.md`).
- **Validation errors** are produced by the validation middleware as `400 { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: fieldErrors } }`.
- **Frontend** converts every non-2xx into a typed `ApiClientError`, prefers per-field `details`, and always renders a readable message via `ErrorMessage` (never raw JSON, never a blank screen); network failures become a friendly `NETWORK_ERROR` (AC-10).

---

## Testing Strategy Link

The mandatory correctness proof is the state-machine integration suite. Full detail — scope, what is and isn't covered, and the 15-case matrix — is in **`test-strategy.md`**, with the passing run recorded in `docs/debugging-log.md`.
