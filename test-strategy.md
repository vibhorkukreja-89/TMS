# Test Strategy

> The testing approach for TMS, why the effort is concentrated where it is, and an honest statement of what is and isn't covered. The mandatory piece — state-machine integration tests — is implemented in `backend/src/__tests__/ticket-status.test.ts` and its passing run is recorded in `docs/debugging-log.md`.

---

## Test Scope

**Philosophy: test the risk, not the ratio.** The single highest-risk, highest-judgment part of this system is the **status state machine** — a rule that must hold no matter how the request arrives. That is where automated testing is concentrated, at the **integration** level (HTTP → route → validation → service → repository → DB), because that is the layer at which the requirement is actually stated ("the backend rejects invalid transitions with 422"). Testing the map in isolation would prove the data structure but not the contract; testing through Supertest proves the contract end-to-end on the server.

**In scope (automated):**
- The state machine, exercised over HTTP against a real database.
- HTTP status codes, the response envelope shape, and error `code`/`message` for status changes.
- The 400-vs-422 boundary (malformed status value vs illegal-but-well-formed transition).

**In scope (manual / evidence-based — recorded in `docs/debugging-log.md`):**
- Full CRUD + search/filter end-to-end against running servers (Phase 4 E2E table).
- Persistence across a backend restart.
- Every UI async path shows a user-visible error (Phase 4 UI error-path review).
- Frontend production build (`npm run build`) succeeds.

**Tooling:** Jest 30 + Supertest, transformed by `@swc/jest` (not ts-jest — incompatible with TS 7). Config is CJS (`jest.config.js`) because a `.ts` Jest config cannot be loaded under TS 7 (see `debugging-notes.md` Issue 1). Runs with `--runInBand --forceExit`.

---

## Unit Tests

**Status: not implemented at Core; conscious trade-off.** The state-machine logic is simple (a static map + membership check), and testing it through the HTTP integration layer already exercises the exact branch a unit test would (allowed vs disallowed transition) while additionally proving routing, validation ordering, error mapping, and persistence. A pure-function unit test of `changeStatus` was therefore deprioritised as duplicative for Core. It is listed as a stretch goal (`tasks.md`) and would be the first addition if the service accrued more branching logic.

---

## Component Tests

**Status: not implemented at Core; verified manually instead.** No React Testing Library / component test harness was added, to keep the dependency surface minimal (consistent with the no-axios / no-React-Query dependency discipline). The frontend's correctness-critical behaviour — *never offering an illegal transition* — is a mirror of the backend map (`lib/status-transitions.ts`) whose authority is already proven server-side, so a failure there degrades UX but cannot violate the business rule. Component behaviour (loading/error/empty states, status control options, comment submission) was validated manually and captured in the Phase 4 UI error-path review.

---

## API / Integration Tests

This is the core of the automated suite: **15 tests, all passing** (`npm test` → `Tests: 15 passed, 15 total`).

**Setup/teardown & isolation:** `beforeAll` creates a dedicated test user; each test creates its own ticket in a chosen status; `afterAll` deletes all tickets created by the test user, deletes the user, and disconnects Prisma. A separate `DATABASE_URL_TEST` is supported so tests never run against the dev database.

### Valid transitions → HTTP 200 (5)
| # | Transition | Assertion |
|---|-----------|-----------|
| 1 | `OPEN → IN_PROGRESS` | 200, `data.status === "IN_PROGRESS"` |
| 2 | `IN_PROGRESS → RESOLVED` | 200, `data.status === "RESOLVED"` |
| 3 | `RESOLVED → CLOSED` | 200, `data.status === "CLOSED"` |
| 4 | `OPEN → CANCELLED` | 200, `data.status === "CANCELLED"` |
| 5 | `IN_PROGRESS → CANCELLED` | 200, `data.status === "CANCELLED"` |

### Invalid transitions → HTTP 422 + `INVALID_TRANSITION` (9)
Each asserts `status === 422`, `error.code === "INVALID_TRANSITION"`, `error.message` matches `/Cannot transition/i`.

| # | Transition | Category |
|---|-----------|----------|
| 6 | `OPEN → RESOLVED` | skip a state |
| 7 | `OPEN → CLOSED` | skip multiple states |
| 8 | `IN_PROGRESS → OPEN` | reverse |
| 9 | `RESOLVED → IN_PROGRESS` | reverse |
| 10 | `RESOLVED → OPEN` | reverse |
| 11 | `CLOSED → OPEN` | terminal — no exit |
| 12 | `CLOSED → IN_PROGRESS` | terminal — no exit |
| 13 | `CANCELLED → OPEN` | terminal — no exit |
| 14 | `CANCELLED → IN_PROGRESS` | terminal — no exit |

### Validation boundary → HTTP 400 (1)
| # | Input | Assertion |
|---|-------|-----------|
| 15 | `status: "BOGUS_STATUS"` | 400, `error.code === "VALIDATION_ERROR"` |

This last case is deliberate: it proves the **validation layer sits in front of the state machine**, so a garbage value is a 400 (bad input), while a real-but-illegal move is a 422 (business rule).

---

## Edge Case Tests

Covered by the suite above and/or the Phase 4 manual E2E evidence:
- **Both terminal states** are proven non-exitable (tests 11–14).
- **Skip-state and reverse** transitions are proven rejected (tests 6–10).
- **Malformed enum value** proven to short-circuit at validation (test 15).
- **Empty title / empty comment** → 400 (Phase 4 E2E).
- **Invalid transition surfaced in the UI** rather than a broken screen (Phase 4 UI review).
- **Data survives a restart** (Phase 4 persistence check).
- **Combined search + status filter** returns the intersection (Phase 4 E2E).

---

## Tests Not Covered (and why)

| Area | Not covered | Why |
|------|-------------|-----|
| Unit tests for `changeStatus` | No isolated unit test | Fully exercised via integration; duplicative for Core (stretch goal) |
| React component tests | No RTL harness | Dependency discipline; UI rule is a UX mirror of a server-proven rule; verified manually |
| CRUD happy-path integration | Not automated | Verified via Phase 4 E2E against running servers; the *mandated* automated focus is the state machine |
| Search/filter automated tests | Not automated | Verified manually (Phase 4 E2E: keyword + combined filter) |
| Auth / RBAC | Not tested | Out of scope (no auth in Core) |
| Load / performance | Not tested | Out of scope for an internal tool of this size |
| E2E browser automation (Playwright/Cypress) | Not added | Manual end-to-end verification was sufficient at Core scope |

**Honest summary:** automated testing is intentionally deep on the one requirement that is both mandated and genuinely risky (the state machine) and relies on documented manual verification elsewhere. If continued, the first additions would be automated CRUD + search integration tests and a small RTL suite for `StatusControl`, wired into a CI workflow (`npm test` + frontend build) — noted in `reflection.md`.
