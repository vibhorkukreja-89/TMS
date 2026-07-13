# TMS — Task Breakdown

> **Assessment artifact** — track implementation progress here. Update status as tasks complete.
>
> Status key: `[ ]` pending · `[~]` in progress · `[x]` done
>
> **PR policy:** Open a PR at the end of every phase before starting the next one. Use the PR description template from `tms-artifacts` rule (What / Why / Test evidence / AI usage). PRs provide traceability from spec to implementation and are required assessment artifacts.

---

## Phase 0 — Setup & Planning

- [x] Create `.cursor/rules/` with all rules
- [x] Create `PROJECT.md`, `CONVENTIONS.md`, `RULES.md`
- [x] Create `tool-specific/cursor-workflow/` artifacts
- [x] Create `docs/` scaffold
- [x] Create project-level skills in `.cursor/skills/`
- [x] Complete `docs/requirement-analysis.md`
- [x] Complete `docs/design-decisions.md` (data model decisions)
- [x] Initialise git repository with initial commit
- [x] **Open PR: Phase 0 — Project Setup & Planning**

---

## Phase 1 — Backend Foundation

### 1.1 Project scaffold

- [x] `npm init` + TypeScript config in `backend/`
- [x] Install dependencies: express, prisma, zod, cors, dotenv
- [x] Set up `tsconfig.json` with path aliases
- [x] Set up `ts-node-dev` for dev server
- [x] Create `backend/src/config.ts` (validated env config)
- [x] Create `.env.example`

### 1.2 Database & Prisma

- [x] `prisma init` — configure PostgreSQL provider
- [x] Write `schema.prisma` — User, Ticket, Comment models
- [x] Run `prisma migrate dev --name init` ← migration applied (20260713130455_init)
- [x] Write `prisma/seed.ts` — 3 users, 6 tickets, 5 comments (fictional data, R-SEC-2)
- [x] Verify `prisma db seed` runs without errors ← TypeScript clean, runs via `npm run db:seed`
- [x] Update `docs/design-decisions.md` with data model choices

### 1.3 Repository layer

- [x] `src/repositories/user.repository.ts` — findAll, findById
- [x] `src/repositories/ticket.repository.ts` — findAll (with search/filter), findById, create, update
- [x] `src/repositories/comment.repository.ts` — findByTicketId, create

### 1.4 Service layer

- [x] `src/services/ticket.service.ts`:
  - `createTicket()`
  - `getTickets(search?, status?)` — search + filter
  - `getTicketById()`
  - `updateTicket()` (fields only)
  - `changeStatus()` — state machine enforced here
- [x] `src/services/comment.service.ts` — `addComment()`
- [x] Update `docs/design-decisions.md` with state machine implementation choice

### 1.5 Validation

- [x] `src/validators/ticket.validator.ts` — createTicketSchema, updateTicketSchema, changeStatusSchema
- [x] `src/validators/comment.validator.ts` — createCommentSchema
- [x] `src/middleware/validate.ts` — Zod validation middleware

### 1.6 Routes and middleware

- [x] `src/middleware/error-handler.ts` — central error handler
- [x] `src/routes/ticket.router.ts` — all ticket endpoints
- [x] `src/routes/comment.router.ts` — POST /:id/comments
- [x] `src/routes/user.router.ts` — GET /users
- [x] `src/app.ts` — Express app setup, route mounting, middleware
- [x] `src/server.ts` — start server
- [x] **Open PR: Phase 1 — Backend Foundation**

---

## Phase 2 — State Machine Integration Tests (mandatory)

- [x] Install Jest + Supertest + @swc/jest (ts-jest incompatible with TS7 — see debugging-log Bug 001)
- [x] Configure `jest.config.js` (CJS — jest.config.ts cannot be loaded with TS7)
- [x] Create `src/__tests__/ticket-status.test.ts`
- [x] Write tests for all 5 valid transitions (expect 200)
- [x] Write tests for representative invalid transitions (expect 422)
- [x] Verify all tests pass: `npm test` → 15/15 passed in 0.998s
- [x] Record test run output in `docs/debugging-log.md`
- [x] **Open PR: Phase 2 — State Machine Integration Tests** → https://github.com/vibhorkukreja-89/TMS/pull/3

---

## Phase 3 — Frontend Foundation

### 3.1 Project scaffold

- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] Install: react-router-dom (native fetch used instead of axios — DD-8)
- [x] Set up `tsconfig.app.json` with path aliases
- [x] Configure `vite.config.ts` proxy for backend API

### 3.2 Types and API client

- [x] `src/types/index.ts` — Ticket, User, Comment, ApiResponse types
- [x] `src/api/tickets.api.ts` — typed fetch wrappers for all ticket endpoints
- [x] `src/api/users.api.ts` — users fetch wrapper

### 3.3 Core pages

- [x] `src/pages/TicketListPage.tsx` — list, search bar, status filter, create button
- [x] `src/pages/TicketDetailPage.tsx` — detail view, comments, status control, edit form
- [x] `src/pages/CreateTicketPage.tsx` — create ticket form

### 3.4 Key components

- [x] `src/components/TicketCard.tsx` — ticket summary card
- [x] `src/components/StatusBadge.tsx` — coloured status indicator
- [x] `src/components/StatusControl.tsx` — shows only valid next transitions
- [x] `src/components/CommentThread.tsx` — comment list + add comment form
- [x] `src/components/ErrorMessage.tsx` — user-visible error display

### 3.5 Hooks

- [x] `src/hooks/useTickets.ts` — ticket list + search/filter state
- [x] `src/hooks/useTicketDetail.ts` — single ticket + comments
- [x] `src/hooks/useMutation.ts` — generic create/update with loading/error state

### 3.6 Routing

- [x] Set up react-router-dom routes: `/`, `/tickets/new`, `/tickets/:id`
- [x] **Open PR: Phase 3 — Frontend Foundation** → https://github.com/vibhorkukreja-89/TMS/pull/4

---

## Phase 4 — Integration and Polish

- [x] Verify end-to-end: create → list → detail → update → status change → comment → search
- [x] Test invalid state transition shows error in UI (not a broken screen)
- [x] Test validation error (empty title) shows form error
- [x] Test data persists after server restart
- [x] Review all API error paths — do they all show a user-visible message?
- [x] **Open PR: Phase 4 — Integration and Polish** → https://github.com/vibhorkukreja-89/TMS/pull/5

---

## Phase 5 — Documentation and Submission

- [x] Write `README.md` with complete setup instructions (clean-clone test)
- [x] Complete `docs/reflection.md`
- [x] Verify `prompt-history/` is populated
- [x] Verify `docs/` has all four artifact files with real content
- [x] Verify `.env` is not committed (`git status` check)
- [x] Verify all state machine integration tests pass
- [ ] **Open PR: Phase 5 — Final Submission (with complete PR description)**

---

## Stretch Goals (optional)

- [ ] Authentication (JWT, protected routes, role checks)
- [ ] Filter by priority + assignee; sorting; pagination on ticket list
- [ ] Unit tests for `TicketService.changeStatus()` directly
- [ ] Swagger / OpenAPI docs
- [ ] Docker Compose setup
- [ ] GitHub Actions CI
