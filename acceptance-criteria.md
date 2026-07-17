# Acceptance Criteria

> All criteria below are derived from `requirements-analysis.md` and are verifiable against the running system or the test suite. Every box is checked because the corresponding behaviour has been implemented and verified (see `test-strategy.md`, `debugging-notes.md`, and the Phase 2/4 evidence in `docs/debugging-log.md`). The canonical Given/When/Then form lives in `tool-specific/cursor-workflow/acceptance-criteria.md`.

---

## Core

- [x] **Create ticket** — submitting a valid title + priority creates a ticket with status `OPEN`, persists it, and returns `201 { data }`; the UI redirects to the detail view.
- [x] **List tickets** — all tickets are displayed with title, priority, status, and assignee.
- [x] **View detail** — the detail view shows all fields (title, description, priority, status, assignee, createdAt, updatedAt) plus the comment thread.
- [x] **Update fields** — editing title, description, priority, or assignee persists and re-renders the new values.
- [x] **Change status (state machine)** — a legal transition (e.g. `OPEN → IN_PROGRESS`) updates the ticket and reflects in the UI.
- [x] **Status control offers only legal moves** — for an `OPEN` ticket the control shows only `IN_PROGRESS` and `CANCELLED`; never `RESOLVED`/`CLOSED`.
- [x] **Add comment** — a non-empty comment persists and appears in the thread with its author.
- [x] **Search** — case-insensitive partial match on title + description returns only matching tickets.
- [x] **Filter by status** — exact-match status filter narrows results; combinable with search.
- [x] **List users** — `GET /api/users` returns seeded users for the assignee/author dropdowns.

## Validation

- [x] **Empty title rejected** — `POST /api/tickets` with an empty title returns `400 VALIDATION_ERROR` and a per-field message (`Title is required`).
- [x] **Priority required + enumerated** — missing or out-of-enum priority returns `400`.
- [x] **Empty comment rejected** — `POST .../comments` with an empty message returns `400 VALIDATION_ERROR`.
- [x] **Empty update rejected** — `PATCH /api/tickets/:id` with no fields returns `400` ("at least one field must be provided").
- [x] **Unknown status value rejected before the state machine** — `PATCH .../status` with a bogus status returns `400 VALIDATION_ERROR` (Zod enum), not 422.
- [x] **Backend always re-validates** — frontend validation is UX-only; the API is authoritative.

## Error Handling

- [x] **Single response envelope** — every response is `{ data }` / `{ error: { code, message } }` (health check aside).
- [x] **Correct status codes** — 200 · 201 · 400 (validation) · 404 (not found) · 422 (business rule / transition) · 500 (unexpected).
- [x] **Invalid transition → 422** — illegal transitions return `{ error: { code: "INVALID_TRANSITION", message: "Cannot transition from X to Y" } }`.
- [x] **Terminal states are terminal** — any transition out of `CLOSED`/`CANCELLED` returns 422.
- [x] **Central error handler** — routes never swallow errors locally; all errors bubble to `error-handler.ts` middleware.
- [x] **UI shows readable errors** — 400/404/422/500 all render a human message (never raw JSON or a blank screen).
- [x] **Network failure handled** — an unreachable API yields a friendly `NETWORK_ERROR` message, no crash.
- [x] **Validation detail surfaced** — the client prefers Zod per-field `details` over the generic "Validation failed".

## Testing

- [x] **Mandatory state-machine suite exists** — `backend/src/__tests__/ticket-status.test.ts` (Jest + Supertest).
- [x] **All 5 valid transitions → 200** — `OPEN→IN_PROGRESS`, `IN_PROGRESS→RESOLVED`, `RESOLVED→CLOSED`, `OPEN→CANCELLED`, `IN_PROGRESS→CANCELLED`.
- [x] **Representative invalid transitions → 422** — 9 cases: skip-state, reverse, and terminal-exit attempts, each asserting `INVALID_TRANSITION` + `/Cannot transition/i`.
- [x] **Malformed status value → 400** — asserts the validation boundary sits in front of the state machine.
- [x] **Suite passes** — `npm test` → 15/15 passing (recorded in `docs/debugging-log.md`).
- [x] **Test isolation** — tests create their own user/tickets and clean up; a dedicated `DATABASE_URL_TEST` is supported.

## Documentation

- [x] **README** — clean-clone setup, scripts, API overview, transition diagram, "expect 15/15" note.
- [x] **Lifecycle artifacts** — `docs/requirement-analysis.md`, `docs/design-decisions.md` (DD-1…DD-20), `docs/debugging-log.md`, `docs/reflection.md`.
- [x] **Submission artifacts** — this file plus `requirements-analysis.md`, `implementation-plan.md`, `design-notes.md`, `api-contract.md`, `test-strategy.md`, `debugging-notes.md`, `code-review-notes.md`, `reflection.md`, `pr-description.md`.
- [x] **Prompt history** — full log in `prompt-history/` (39 entries) and grouped-by-activity in `ai-prompts/`.
- [x] **Cursor setup documented** — `tool-specific/cursor-workflow/` describes the rules/skills/context layering.
- [x] **No secrets committed** — verified via `git status`; only `.env.example` is tracked.
- [x] **Traceable PRs** — one PR per phase (#1–#6) with the What/Why/Test/AI-usage template.
