# Design Decisions

> **Assessment artifact** — record of significant architecture, data model, and implementation decisions. Update this as decisions are made, not after the fact.

---

## DD-1: Stack Selection

**Decision:** React + TypeScript (frontend) · Node.js + Express + TypeScript (backend) · PostgreSQL · Prisma

**Rationale:**
- TypeScript across the stack gives end-to-end type safety and catches integration bugs early
- React is the team standard; Vite provides fast development iteration
- PostgreSQL fits the relational data model naturally (tickets have foreign keys to users, comments to tickets)
- Prisma provides type-safe queries generated from the schema — no string SQL, no ORM magic
- Express is minimal and gives full control; the application logic is simple enough not to warrant a framework

**Alternatives rejected:**
- SQLite: Ruled out because PostgreSQL's `ILIKE` for case-insensitive search is cleaner; also PostgreSQL is production-realistic
- MongoDB: The data is clearly relational (FK relationships); a document store would require manual join logic
- Next.js: The full-stack approach would blur frontend/backend boundaries; separate servers make the architecture clearer for the assessment

---

## DD-2: Module Boundary Enforcement

**Decision:** Strict 3-layer backend architecture: routes → services → repositories

**Rationale:**
- Testability: Services can be tested without HTTP; repositories can be mocked in service tests
- Maintainability: Changing the ORM only touches repositories; changing business rules only touches services
- Assessment visibility: The architecture reflects engineering maturity, not just working code

**Implementation:** Enforced via the `tms-project-context` Cursor rule. The AI will not generate Prisma calls in service or route files.

---

## DD-3: State Machine Implementation

**Decision:** State machine implemented as a static transition map in `TicketService.changeStatus()`

```typescript
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      [],
  CANCELLED:   [],
};
```

**Rationale:**
- Explicit and readable — transitions are visible in code, not hidden in conditional logic
- Easy to test — the map itself is the contract
- Easy to extend — add a new state by adding an entry
- Single source of truth — backend only; frontend derives UI options from current status via the same logic (or from a shared type)

**Alternatives rejected:**
- State machine library (e.g. XState): Overkill for 5 states; adds a dependency; obscures the logic in assessment context
- Database-driven transitions: Over-engineered; transitions don't need to be configurable at runtime

---

## DD-4: API Response Envelope

**Decision:** All responses use `{ data: T }` or `{ error: { code, message } }`. No bare responses.

**Rationale:**
- Consistent shape makes frontend error handling straightforward — always check `.error` first
- `code` enables the frontend to branch on specific error types (e.g. show different UI for `INVALID_TRANSITION` vs `VALIDATION_ERROR`)
- Avoids coupling the frontend to backend HTTP status codes alone

---

## DD-5: Validation Strategy

**Decision:** Zod schemas in `validators/`, applied via middleware before handlers run

**Rationale:**
- Zod infers TypeScript types from schemas — one source of truth for both validation and types
- Middleware approach keeps handlers free of validation boilerplate
- Backend always re-validates (frontend validation is UX-only)

---

## DD-6: Search Implementation

**Decision:** Postgres `ILIKE` on `title` and `description`, combined with optional status filter

**Rationale:**
- `ILIKE` provides case-insensitive partial matching without full-text search overhead (overkill for Core)
- Prisma supports `contains` with `mode: 'insensitive'` which compiles to `ILIKE`
- Status filter is an exact match (enum field)

---

## DD-7: Dev Server — ts-node-dev over nodemon + ts-node

**Decision:** Use `ts-node-dev` as the single dev-server tool.

**Rationale:**
- `ts-node-dev` caches compiled modules between restarts, making hot-reload significantly faster than `nodemon + ts-node`
- Single dev dependency instead of two
- `--transpile-only` flag skips type-checking in the dev server (tsc handles that separately), keeping restarts instant

**Implementation:** `ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/server.ts`. The `-r tsconfig-paths/register` flag is required to resolve `@/` path aliases at runtime (tsconfig paths are otherwise only honoured by the TypeScript compiler).

---

## DD-8: Native fetch over axios (frontend)

**Decision:** Use native `fetch` with a thin typed wrapper rather than importing axios.

**Rationale:**
- Node 18+ and all target browsers support `fetch` natively — no extra dependency needed (R-ARCH-3)
- A typed wrapper in `src/api/` gives the same DX as axios without the bundle cost
- Keeps `package.json` minimal; any future maintainer already knows `fetch`

**Alternatives rejected:**
- axios: Adds ~40 KB to the bundle; the only features needed (base URL, JSON parsing, error handling) are trivially implemented with `fetch`

---

## DD-9: Zod env validation loaded in config.ts

**Decision:** `dotenv.config()` is called inside `backend/src/config.ts` rather than in `server.ts` or `app.ts`.

**Rationale:**
- Any module that imports `config` gets the env loaded as a side effect — no need to ensure `dotenv.config()` is called first in entry points
- Single location for all env access; `process.env` is never referenced directly elsewhere in the codebase
- Zod `parse` throws at startup if a required variable is missing — fail-fast rather than silently undefined

---

## DD-10: Data Model — FK naming convention

**Decision:** FK fields in Prisma schema use the `<relation>Id` suffix (e.g. `createdById`, `assignedToId`, `ticketId`) rather than the raw column name. The DB column is mapped via `@map("created_by")`.

**Rationale:**
- Prisma generates TypeScript types where `createdById` is the scalar FK and `createdBy` is the relation object — the `Id` suffix prevents naming collisions
- The DB columns remain snake_case (`created_by`, `assigned_to`) satisfying the CONVENTIONS.md requirement
- This is the Prisma-idiomatic pattern and avoids the common pitfall of naming a field `created_by` and an FK column `created_by` identically

---

## DD-11: Comment deletion cascade

**Decision:** `Comment` has `onDelete: Cascade` on the `Ticket` relation.

**Rationale:**
- When a ticket is deleted, its comments have no meaning without it — orphaned comments are a data integrity problem
- Cascade is the correct semantic; no explicit "delete ticket" operation exists in the current spec but this future-proofs the schema

---

## DD-12: Prisma 7 — generated client at `src/generated/prisma`

**Decision:** Accept Prisma 7's default generator output of `src/generated/prisma` rather than the legacy `@prisma/client` path.

**Rationale:**
- Prisma 7 moved to a new `prisma-client` generator that outputs to a local `src/generated/` path, giving full control over the generated code
- `src/generated/prisma` is added to `.gitignore` (auto-generated by `prisma init`) — generated code is never committed
- Repository imports use `import { PrismaClient } from '@/generated/prisma'` via the path alias
- The `prisma.config.ts` file handles datasource URL via `dotenv/config` import, keeping `schema.prisma` free of env-var references

---

## DD-13: Prisma 7 requires `@prisma/adapter-pg` driver adapter

**Decision:** Use `@prisma/adapter-pg` (with `pg` Pool) to initialise `PrismaClient` instead of the legacy zero-arg constructor.

**Rationale:**
- Prisma 7's new `prisma-client` generator removed the implicit datasource URL fallback from the client constructor. `PrismaClientOptions` now requires either an `adapter` or `accelerateUrl` — `new PrismaClient()` with no arguments is a TypeScript error.
- `@prisma/adapter-pg` is the official Prisma-maintained PostgreSQL adapter; it wraps `pg.Pool` and is the recommended path for direct Postgres connections in Prisma 7.
- The `Pool` is created once and shared via the global singleton in `src/db.ts`, so connection limits are respected.

**Alternatives rejected:**
- `accelerateUrl`: Requires a paid Prisma Accelerate account — not appropriate for a local dev/assessment project.
- Downgrading to Prisma 4/5: Would contradict the already-run migration and generated client.

---

## DD-14: `tsx` replaces `ts-node` as the TypeScript runner

**Decision:** Use `tsx` (esbuild-backed TypeScript executor) instead of `ts-node` for running scripts (`npm run dev`, `npm run db:seed`).

**Rationale:**
- `ts-node` 10.x is incompatible with TypeScript 7 — it crashes with `Cannot read properties of undefined (reading 'fileExists')` because the TS compiler API changed.
- `tsx` uses esbuild to transpile TypeScript with no type-checking overhead, making hot-reloads instant.
- `tsx watch` replaces `ts-node-dev` for the dev server with the same DX but full TS 7 compatibility.
- `tsx` is a well-maintained, widely-adopted package (19M+ weekly downloads) with zero transitive dependencies.

---

## DD-15: Frontend data layer — custom hooks + typed fetch

**Decision:** Phase 3 uses thin `api/` fetch wrappers + custom hooks (`useTickets`, `useTicketDetail`, `useUsers`, `useMutation`). No React Query / SWR / axios.

**Rationale:**
- Matches `tasks.md` and keeps the dependency surface minimal (R-ARCH-3 / DD-8)
- Clear layering for assessment: pages compose hooks; hooks call API; API never lives in components
- Enough structure for loading/error without a cache library at Core scope

**Alternatives rejected:**
- Page-local `useEffect` only: duplicates search/error logic; weaker task alignment
- React Query: excellent DX but adds a dependency and is unnecessary for Core

---

## DD-16: Ticket list — compact rows

**Decision:** Ticket list uses compact row items (`TicketCard` as a row), not a dense HTML table and not a card grid.

**Rationale:**
- Scannable without table markup complexity
- Mobile-friendly; still denser than large cards
- Keeps the named `TicketCard` component from the task list meaningful

---

## DD-17: No global current user — per-form `createdBy` select

**Decision:** `createdById` is chosen via a `UserSelect` dropdown on create-ticket and add-comment forms. No header “acting as” session user.

**Rationale:**
- Spec de-scopes auth; requirement analysis allows hardcoded or dropdown
- Per-form select makes authorship explicit in demos without implying fake login
- Avoids global state that would look like incomplete auth

**Alternatives rejected:**
- Header session dropdown: convenient but implies a logged-in user
- Hardcoded single user: too limiting for multi-agent comment demos

---

## DD-18: Ticket detail — split layout with status side panel

**Decision:** Detail page is a split layout: main column for field edit + comments; side panel for current status and `StatusControl` (valid next transitions only).

**Rationale:**
- Status changes are the highest-judgment UX; isolating them makes the state machine visible
- Comments and field edits remain the primary reading/working column
- Side panel stacks below on narrow viewports

---

## DD-19: Express 5 — redefine `req.query` after Zod validation

**Decision:** Validation middleware must not assign to `req.query` / `req.params` directly. Use `Object.defineProperty` to replace the value after Zod parse (body may still be assigned normally).

**Rationale:**
- Express 5 exposes `query`/`params` as getter-only on the request; assignment throws and became a 500 on every ticket list call
- Handlers continue to read `req.query` without introducing a parallel `req.validated` shape

**Alternatives rejected:**
- Attach `req.validatedQuery` and update every handler — more churn for no product benefit
- Drop query validation middleware — would weaken the validation boundary

---

## DD-20: Surface Zod validation `details` in frontend errors

**Decision:** `fetchJson` prefers flattened Zod `error.details` field messages when present, instead of only showing the generic `Validation failed` envelope message.

**Rationale:**
- Backend validation responses include useful per-field messages (e.g. `Title is required`) under `details`
- Showing only `Validation failed` made AC-1/AC-9 UI feedback weaker than the API already provides
- Keeps a single enrichment point in the API client rather than per-form parsing

---

_Add new decisions below as they arise during implementation._
