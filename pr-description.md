# PR Description

> Final submission PR. TMS was built across six phased PRs (#1–#6) on the `boilerplate` branch, each following the What / Why / Test-evidence / AI-usage template. This is the consolidated final-submission description.

**Title:** Phase 5 — Final Submission (Support Ticket Management System)
**Branch:** `boilerplate` → base · **Prior PRs:** #1 Setup & Planning · #2 Backend Foundation · #3 State Machine Integration Tests · #4 Frontend Foundation · #5 Integration & Polish · #6 Final Submission

---

## Summary

A complete full-stack Support Ticket Management System: React + TypeScript frontend, Node + Express + TypeScript backend, PostgreSQL via Prisma. Tickets can be created, listed, searched/filtered, viewed, updated, and commented on, and are progressed through a strictly-enforced five-state status lifecycle. The status state machine is enforced only on the backend (returning HTTP 422 for illegal transitions) and mirrored on the frontend for UX. Data persists in PostgreSQL, all input is validated with Zod, all responses use a single envelope, and the state machine is proven by a 15-test integration suite.

## Features Implemented

- Create ticket (title + priority required; starts `OPEN`).
- List tickets with keyword search (title + description, case-insensitive) and status filter, combinable.
- View ticket detail with all fields, timestamps, and comment thread.
- Update ticket fields (title, description, priority, assignee).
- Change status through the state machine; UI offers only legal next states; 422 rendered clearly on rejection.
- Add comments (author recorded via per-form user select).
- List seeded users for assignee/author dropdowns.
- User-visible error handling on every async path (400 / 404 / 422 / 500 / network), never raw JSON or a blank screen.

## Technical Changes

- **Backend:** strict `routes → services → repositories` layering; state machine as a static `VALID_TRANSITIONS` map in `ticket.service.ts`; typed error classes (`ServiceError`, `NotFoundError`, `InvalidTransitionError`); central error-handler middleware; Zod validators + validation middleware; single response envelope.
- **Bleeding-edge tooling fixes:** `tsx` instead of `ts-node` (TS 7), `@prisma/adapter-pg` for Prisma 7, `Object.defineProperty` for Express 5's read-only `req.query`, relative `paths` + no `baseUrl` for TS 7, CJS `jest.config.js`.
- **Frontend:** Vite + strict TS; typed `fetch` client that unwraps the envelope, surfaces Zod per-field `details`, and maps failures to a typed `ApiClientError`/`NETWORK_ERROR`; custom hooks (`useTickets`, `useTicketDetail`, `useUsers`, `useMutation`); components including `StatusControl` (valid transitions only); split detail layout with a status side panel.
- **No extra dependencies:** no axios, React Query, or state-machine library — deliberate (see `code-review-notes.md`).

## Database Changes

- Prisma schema with `User`, `Ticket`, `Comment` models and `Role` / `Priority` / `TicketStatus` enums; `status` defaults to `OPEN`.
- camelCase model fields mapped to snake_case columns (`@map`); `<relation>Id` FK naming; `Comment` cascades on ticket delete.
- Initial migration `20260713130455_init` applied.
- Seed: 3 users (1 ADMIN, 2 AGENT), 6 tickets across several statuses, 5 comments — fictional data only (no real PII).

## Testing Done

- **`cd backend && npm test` → `Tests: 15 passed, 15 total`** in ~1s: 5 valid transitions (200), 9 invalid transitions (422 `INVALID_TRANSITION`), 1 malformed status value (400 `VALIDATION_ERROR`).
- **Phase 4 end-to-end (against running servers):** create → list → detail → update → status change → comment → search + combined filter; empty title / empty comment → 400; invalid transition → 422 shown in UI; data persists across a backend restart; `frontend npm run build` succeeds. Evidence recorded in `docs/debugging-log.md`.
- Full detail in `test-strategy.md`.

## AI Usage Summary

Built with Cursor (Claude Sonnet) under always-on project rules and a prompt-recorder. AI drove requirement gap-analysis, a plan-before-code planning step, layered scaffolding, the state-machine test matrix, hypothesis generation during debugging (from real logs/curl/screenshots), and a pre-PR code-review pass. All output was validated — tests to green, builds clean, bugs reproduced-then-fixed — and several AI suggestions were rejected with documented reasons (axios, React Query, XState, global fake-auth). Full trace in `prompt-history/` (39 entries) and grouped in `ai-prompts/`; decisions in `docs/design-decisions.md`.

## Screenshots / Demo Notes

- **Ticket list** (`/`): compact rows with title, priority, status badge, assignee; search box + status filter.
- **Create** (`/tickets/new`): title, description, priority, assignee, and author (`UserSelect`); validation errors shown inline.
- **Detail** (`/tickets/:id`): split layout — main column for editable fields + comment thread; side panel for current status and `StatusControl` showing only legal next states. Attempting an illegal transition via the API surfaces the 422 message in the UI.
- **Demo flow:** create a ticket → move `OPEN → IN_PROGRESS → RESOLVED → CLOSED`; then show that a `CLOSED` ticket offers no further transitions and that a direct `OPEN → CLOSED` API call returns 422.

## Known Limitations

- No authentication/authorization (de-scoped by the brief); identity is a per-form seeded-user dropdown.
- Automated tests focus on the state machine; CRUD/search are covered by manual E2E, not automated integration tests; no React component tests.
- No pagination/sorting on the ticket list; search does not cover comments.
- No CI pipeline yet; tests are run locally.

## Future Improvements

- Add authentication (JWT), protected routes, and ADMIN/AGENT role checks.
- Automated CRUD + search integration tests and an RTL suite for `StatusControl`; wire `npm test` + frontend build into GitHub Actions CI.
- Filter by priority/assignee, sorting, and pagination on the list.
- OpenAPI/Swagger docs and a Docker Compose setup.
- A "known stack footguns" rule to pre-empt the TS7/Prisma-7/Express-5 issues on future projects.
