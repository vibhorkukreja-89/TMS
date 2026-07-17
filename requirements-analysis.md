# Requirement Analysis

> AI-assisted analysis performed in Phase 0, before any implementation code was written. The goal was to surface gaps, ambiguities, and edge cases in the brief so that decisions were made deliberately rather than accidentally during coding. This document is a submission-facing companion to `docs/requirement-analysis.md`.

---

## Selected Project Option

**Support Ticket Management System (TMS)** — an internal application for managing support tickets through a defined status lifecycle. Chosen because it has a clear, bounded scope with one genuinely hard sub-problem (the status state machine) that rewards careful backend design, plus enough surface area (CRUD, search/filter, comments, validation, persistence) to demonstrate full-stack competence.

---

## My Understanding (in my own words)

The system lets a small support team track work. A ticket is the unit of work; it is born `OPEN`, moves through a controlled set of statuses as work progresses, and ends in one of two terminal states (`CLOSED` or `CANCELLED`). People can attach comments to a ticket to record context. There is no authentication in scope — the app is single-tenant and trusted — but the data model still records *who* created a ticket or comment, so the UI must supply a user identity somehow (a seeded-user dropdown, not a login).

The interesting engineering is not the CRUD; it is guaranteeing that the **status lifecycle can never be violated**, no matter how the request arrives. That means the rule lives on the server, returns a semantically correct error (422, not 400 or 500) when broken, and the client is prevented from even offering an illegal move. Everything else — validation, search, persistence, error surfacing — is table stakes that must nonetheless be done consistently.

---

## Functional Requirements

| # | Requirement | Notes |
|---|-------------|-------|
| F1 | Create a ticket | Title + priority required; `createdBy` recorded; starts `OPEN` |
| F2 | List all tickets | Show title, priority, status, assignee |
| F3 | View ticket detail | All fields + timestamps + comment thread |
| F4 | Update ticket fields | title, description, priority, assignee (not status) |
| F5 | Change status via state machine | Only legal transitions permitted; enforced server-side |
| F6 | Add a comment to a ticket | Non-empty message; author recorded |
| F7 | Keyword search | Case-insensitive partial match on title + description |
| F8 | Filter by status | Exact enum match; combinable with search |
| F9 | Reject invalid input | HTTP 400 + validation error, surfaced in UI |
| F10 | Reject invalid transitions | HTTP 422 + `INVALID_TRANSITION`, surfaced clearly in UI |
| F11 | List users | Read-only, for assignee/author dropdowns |

## Non-Functional Requirements

| # | Requirement | How it is satisfied |
|---|-------------|--------------------|
| NF1 | **Persistence across restarts** | PostgreSQL + Prisma; no in-memory state |
| NF2 | **Backend is the source of truth** | Backend re-validates all input; frontend validation is UX-only |
| NF3 | **Consistent API contract** | Single response envelope `{ data }` / `{ error: { code, message } }` |
| NF4 | **No secrets committed** | `.env` gitignored; `.env.example` with placeholders committed |
| NF5 | **Clean-clone setup** | README setup verified from scratch |
| NF6 | **Type safety** | TypeScript strict mode on both ends; Zod-inferred DTOs |
| NF7 | **Maintainable architecture** | Strict routes → services → repositories layering |
| NF8 | **Proven correctness of the hard part** | Mandatory state-machine integration tests |

---

## Assumptions

1. **No authentication.** The brief explicitly de-scopes auth from Core, so there is no login, session, or token. `createdBy`/author is supplied by a per-form dropdown over seeded users (see Clarification Q1 and design decision DD-17).
2. **Priority is required at creation.** The brief lists priority as a field but does not mark it required; a support ticket without a priority is not useful, so creation requires it.
3. **Search scope is title + description.** "Keyword search" does not name the fields; these two are the useful ones for support tickets.
4. **Status is changed only through the dedicated status endpoint**, never via the generic field-update endpoint. This keeps the state machine in one place.
5. **IDs are opaque strings** (Prisma `cuid()`), not sequential integers — safe to expose in URLs.
6. **Comments are immutable and append-only** in Core (no edit/delete UI); cascade-delete with their ticket for data integrity.
7. **A single environment/deploy target** (local dev) is sufficient for the exercise; no multi-tenant or scaling concerns.

## Clarifications (questions for a product owner)

These are the questions I would ask a real product owner; each is followed by the assumption I proceeded with in the absence of an answer.

1. **Q:** With no auth, whose identity is attached to a ticket/comment? → *Assumed:* a per-form seeded-user dropdown; the data model supports real auth being added later.
2. **Q:** What exact HTTP status/shape should an illegal transition return? → *Assumed:* 422 + `{ error: { code: "INVALID_TRANSITION", message } }` (request is well-formed but violates a business rule).
3. **Q:** Should `CLOSED`/`CANCELLED` ever be reopened? → *Assumed:* no — both are terminal with no exit.
4. **Q:** Can priority change after creation, and does changing priority affect status? → *Assumed:* priority is freely editable and independent of status.
5. **Q:** Should search also match comments, assignee name, or ID? → *Assumed:* title + description only for Core.
6. **Q:** Is there a required sort order / pagination for the list? → *Assumed:* newest-first, no pagination in Core (listed as a stretch goal).
7. **Q:** Can a ticket be reassigned to nobody (unassigned)? → *Assumed:* yes — `assignedTo` is nullable and can be cleared.

---

## Edge Cases

| Scenario | Expected handling |
|----------|-------------------|
| Ticket not found (bad ID) | 404 `{ error: { code: "NOT_FOUND" } }` |
| Assignee/creator user ID does not exist | 400 validation error (FK) |
| Empty search string | Treated as no search → return all tickets |
| Status filter with an invalid enum value | 400 `VALIDATION_ERROR` |
| Comment added to a non-existent ticket | 404 |
| Transition from a terminal state (`CLOSED`/`CANCELLED`) | 422 `INVALID_TRANSITION` |
| Skipping a state (`OPEN → RESOLVED`, `OPEN → CLOSED`) | 422 `INVALID_TRANSITION` |
| Reverse transition (`IN_PROGRESS → OPEN`, `RESOLVED → IN_PROGRESS`) | 422 `INVALID_TRANSITION` |
| Completely unknown status string (`"BOGUS"`) | 400 `VALIDATION_ERROR` (fails Zod enum before the state machine runs) |
| Empty title / empty comment message | 400 `VALIDATION_ERROR` with per-field detail |
| PATCH with no fields | 400 (`updateTicketSchema` refine: "at least one field") |
| Network unavailable in UI | Friendly `NETWORK_ERROR` message, no crash |
| Backend returns 500 | UI shows a readable message, not raw JSON or a blank screen |

---

## Requirement Clarity Self-Assessment

| Requirement | Clear? | Notes |
|-------------|--------|-------|
| Entity schema | Clear | Minor optionality decisions (description, assignee) |
| State machine | Clear | Transition table explicit in brief |
| Search / filter | Partial | Fields not specified → decided (title + description) |
| Auth | Clear | Explicitly de-scoped |
| Tests | Clear | State-machine integration tests explicitly required |
| Seed data | Clear | Required; exact counts left to implementation |
| Error shapes | Partial | 400 vs 422 distinction inferred and documented |
