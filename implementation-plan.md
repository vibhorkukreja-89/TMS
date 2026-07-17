# Implementation Plan

> The plan that structured the build. Work was delivered in six phases, each ending in a reviewable PR (traceability from spec → implementation). The plan was produced with AI assistance up front (see `ai-prompts/00-context-setting-and-planning.md`) and then executed sub-task by sub-task, updating `tool-specific/cursor-workflow/tasks.md` as items completed.

---

## Overview

**Strategy:** backend-first, correctness-first. Build and prove the hard part (the state machine) before the UI, so the frontend is layered on an already-trusted API. Keep the dependency surface minimal, enforce module boundaries from day one, and log decisions/prompts/bugs as the project progresses rather than retrofitting documentation at the end.

**Sequencing rationale:**
1. Plan and pin conventions before touching code, so AI generation has guardrails.
2. Stand up the backend (schema → repositories → services → validators → routes) so business rules exist server-side.
3. Prove the state machine with integration tests *before* building UI on top of it.
4. Build the frontend against the proven API.
5. Integrate, polish error paths, verify persistence end-to-end.
6. Document, self-review, and submit.

---

## Task Breakdown

### Phase 0 — Setup & Planning
- Author `.cursor/rules/` (context, conventions, artifacts, testing, prompt-recorder) and `.cursor/skills/`.
- Write `PROJECT.md`, `CONVENTIONS.md`, `RULES.md`, and the `tool-specific/cursor-workflow/` artifacts (spec, tasks, acceptance criteria, project-context).
- Complete `docs/requirement-analysis.md` and seed `docs/design-decisions.md`.
- Initialise git; open **PR #1**.

### Phase 1 — Backend Foundation
- Scaffold `backend/` (package.json, strict tsconfig with `@/*` path aliases, dev runner, Zod-validated `config.ts`, `.env.example`).
- `prisma init` (PostgreSQL) → `schema.prisma` (User/Ticket/Comment, enums, snake_case `@map`) → `migrate dev --name init` → `seed.ts` (3 users, 6 tickets, 5 comments).
- Repository layer (user/ticket/comment) — the *only* place Prisma is called.
- Service layer — ticket CRUD + `changeStatus` (state machine), comment add, user list.
- Validators (Zod) + validation middleware; central error handler + typed error classes.
- Routers (ticket/comment/user) + `app.ts` + `server.ts`. Open **PR #2**.

### Phase 2 — State Machine Integration Tests (mandatory)
- Jest + Supertest + `@swc/jest`; CJS `jest.config.js`.
- `ticket-status.test.ts`: 5 valid → 200, 9 invalid → 422 (`INVALID_TRANSITION`), 1 bogus value → 400.
- Verify `npm test` → 15/15; record output in `docs/debugging-log.md`. Open **PR #3**.

### Phase 3 — Frontend Foundation
- Vite react-ts scaffold; strict tsconfig aliases; Vite proxy `/api → :3000`.
- Types + typed `fetch` API client (envelope-aware, error-enriching).
- Custom hooks (`useTickets`, `useTicketDetail`, `useUsers`, `useMutation`).
- Components (`TicketCard`, `StatusBadge`, `StatusControl`, `CommentThread`, `ErrorMessage`, `UserSelect`).
- Pages (list + search/filter, create, detail split-layout with status side panel) + routing. Open **PR #4**.

### Phase 4 — Integration & Polish
- End-to-end verification: create → list → detail → update → status → comment → search.
- Confirm invalid transition and validation errors render in the UI (not broken screens).
- Confirm persistence across a backend restart.
- Audit every async path for a user-visible error message. Open **PR #5**.

### Phase 5 — Documentation & Submission
- README (clean-clone), `docs/reflection.md`, verify prompt history, verify no `.env` committed, verify 15/15 tests. Open **PR #6** with the full PR description.

---

## Milestones

| Milestone | Definition of done | PR |
|-----------|--------------------|----|
| M0 — Planning locked | Rules, conventions, spec, requirement analysis complete | #1 |
| M1 — API works | All endpoints return correct envelopes; data persists | #2 |
| M2 — State machine proven | 15/15 integration tests green | #3 |
| M3 — UI usable | All Core screens functional against the API | #4 |
| M4 — Hardened | Error paths + persistence verified end-to-end | #5 |
| M5 — Submitted | Docs, reflection, prompt history, clean-clone verified | #6 |

---

## AI Usage Plan

| Lifecycle stage | How AI was used | How output was governed / validated |
|-----------------|-----------------|-------------------------------------|
| Requirement analysis | Enumerate gaps, ambiguities, edge cases | Human decided Core vs stretch; documented in requirement analysis |
| Planning | Produce a step-by-step plan **before** any code, constrained by `RULES.md`/`CONVENTIONS.md` | Plan reviewed and approved before execution |
| Scaffolding | Generate boilerplate (config, tsconfig, folder layout, Vite proxy) | Compiled + ran; fixed TS7/Prisma-7/Express-5 mismatches |
| Business logic | Draft the state-machine map + service methods | Verified by the integration suite, not by trust |
| Tests | Generate the 15-case Jest suite from the spec's transition table | Ran to green; asserted status + code + message shape |
| Frontend | Scaffold hooks/components/pages from an approved design | Manual UX review; strict TS; lint |
| Debugging | Hypothesis generation from runtime evidence (logs/curl/screenshots) | Fix confirmed by reproducing then re-running |
| Review | Self-review checklist / code-reviewer pass before each PR | Findings triaged; some accepted, some rejected with reasons |
| Documentation | Draft docs/prompt summaries | Edited for accuracy against real code |

**Guardrails:** always-on Cursor rules injected project context; a prompt-recorder rule logged every prompt; a per-phase PR cadence forced small, reviewable increments; no real secrets were ever pasted into prompts (only `.env.example` placeholders).

---

## Risks

| # | Risk | Likelihood | Impact |
|---|------|-----------|--------|
| R1 | State machine logic leaks into routes/DB or is only enforced client-side | Medium | High — core requirement failure |
| R2 | Bleeding-edge tooling (TS 7, Prisma 7, Express 5) has breaking changes vs AI's training data | High | Medium — build/runtime breakage |
| R3 | AI adds unneeded dependencies (axios, React Query, XState) | Medium | Low/Medium — bloat, convention drift |
| R4 | 400 vs 422 confusion (validation vs business rule) | Medium | Medium — wrong contract |
| R5 | Tests run against the dev database and corrupt seed data | Medium | Medium — flaky/destructive tests |
| R6 | Secrets accidentally committed | Low | High — security failure |
| R7 | Documentation left empty until the end (assessment red flag) | Medium | Medium — lost marks |

## Mitigation

| # | Mitigation |
|---|-----------|
| R1 | Module-boundary Cursor rule (Prisma only in repositories, business logic only in services); state machine unit of truth in `ticket.service.ts`; frontend map is UX-only; **integration tests prove server-side enforcement**. |
| R2 | Pin runtime assumptions early; when the build broke, diagnose from real errors (TS5102/TS5090 path aliases, `ts.sys.fileExists`, `req.query` getter) and record each as a design decision / bug entry (DD-12/13/14/19, Bug 001/002). |
| R3 | Dependency-discipline rule; explicitly rejected axios/React Query/XState — used native `fetch`, custom hooks, and a static transition map (DD-8/15, DD-3). |
| R4 | Fixed the contract in requirement analysis: 400 for malformed input (Zod), 422 for a well-formed request that breaks a business rule; a test asserts a bogus status value returns 400, not 422. |
| R5 | Support a separate `DATABASE_URL_TEST`; tests create and delete their own data in `beforeAll`/`afterAll`. |
| R6 | `.env` gitignored; only `.env.example` committed; `git status` checked before submission; no credentials in prompts. |
| R7 | Update-cadence rule: design decisions logged as made, bugs logged as found, tasks ticked as done, prompts auto-recorded — nothing deferred to the end. |
