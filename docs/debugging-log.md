# Debugging Log

> **Assessment artifact** — record of real debugging sessions during TMS development.
> Update this whenever a non-trivial bug is investigated. Short, honest entries are better than none.

---

## Entry format

```
## Bug NNN: [Short description]

**Date:** YYYY-MM-DD  
**Phase:** [Phase 1 / Phase 2 / etc.]

**Symptom:** What was observed (error message, wrong output, failing test)

**Context given to AI:** What I shared with Cursor when asking for help

**Hypotheses explored:**
1. [Hypothesis 1 — verified/ruled out by X]
2. [Hypothesis 2 — verified/ruled out by Y]

**Root cause:** What was actually wrong

**Fix:** What was changed and why

**Takeaway:** What this taught me (about the code, the AI, or the workflow)
```

---

## Bug 001: `jest.config.ts` fails to load — TS7 + ts-node incompatibility

**Date:** 2026-07-13
**Phase:** Phase 2 — State Machine Integration Tests

**Symptom:**
```
Jest: Failed to parse the TypeScript config file jest.config.ts
TypeError: Cannot read properties of undefined (reading 'fileExists')
```

**Context given to AI:** Ran `npm test` after creating `jest.config.ts`. Same error was seen earlier in Phase 1 when running `ts-node` directly.

**Hypotheses explored:**
1. `@swc/jest` transform not installed — ruled out (packages installed successfully)
2. Jest trying to load `jest.config.ts` via `ts-node` before the SWC transform is active — confirmed. Jest uses `ts-node` (or native Node.js TS support) to load its own config file; this happens before any `transform` plugin is applied

**Root cause:** Jest attempts to parse `jest.config.ts` using the TypeScript compiler API (via ts-node) to bootstrap itself. TypeScript 7 changed the `ts.sys` API, causing ts-node 10.x to crash with `undefined` when accessing `ts.sys.fileExists`. This is the same root cause as the ts-node / ts-node-dev issue documented in DD-14.

**Fix:** Renamed `jest.config.ts` → `jest.config.js` (CommonJS). Since `package.json` has `"type": "commonjs"`, this file is loaded natively by Node.js without any TypeScript transpilation. The `@swc/jest` transform still handles all `.test.ts` files.

**Takeaway:** The Jest config file itself is NOT subject to the project's `transform` config — it must be loadable by Node.js directly. In a TypeScript 7 project, always use `jest.config.js` (CJS) or `jest.config.mjs` (ESM). Never `jest.config.ts`.

---

## Phase 2 Test Run — 2026-07-13

**Command:**
```bash
cd backend && npm test
```

**Output:**
```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        0.998 s
```

**Tests executed:**

| # | Description | Expected | Result |
|---|---|---|---|
| 1 | OPEN → IN_PROGRESS | 200 | ✅ |
| 2 | IN_PROGRESS → RESOLVED | 200 | ✅ |
| 3 | RESOLVED → CLOSED | 200 | ✅ |
| 4 | OPEN → CANCELLED | 200 | ✅ |
| 5 | IN_PROGRESS → CANCELLED | 200 | ✅ |
| 6 | OPEN → RESOLVED (invalid) | 422 + INVALID_TRANSITION | ✅ |
| 7 | OPEN → CLOSED (invalid) | 422 + INVALID_TRANSITION | ✅ |
| 8 | IN_PROGRESS → OPEN (backwards) | 422 + INVALID_TRANSITION | ✅ |
| 9 | RESOLVED → IN_PROGRESS (backwards) | 422 + INVALID_TRANSITION | ✅ |
| 10 | RESOLVED → OPEN (backwards) | 422 + INVALID_TRANSITION | ✅ |
| 11 | CLOSED → OPEN (terminal) | 422 + INVALID_TRANSITION | ✅ |
| 12 | CLOSED → IN_PROGRESS (terminal) | 422 + INVALID_TRANSITION | ✅ |
| 13 | CANCELLED → OPEN (terminal) | 422 + INVALID_TRANSITION | ✅ |
| 14 | CANCELLED → IN_PROGRESS (terminal) | 422 + INVALID_TRANSITION | ✅ |
| 15 | Bogus status value | 400 + VALIDATION_ERROR | ✅ |

All 15 tests passed. No flakiness observed.

---

## Bug 002: Ticket list returns 500 — Express 5 read-only `req.query`

**Date:** 2026-07-13  
**Phase:** Phase 3 — Frontend Foundation

**Symptom:** Landing page showed `An unexpected error occurred` immediately. Backend returned HTTP 500 for `GET /api/tickets`. `GET /api/users` worked.

**Context given to AI:** Screenshot of TMS Tickets page with pink error banner.

**Hypotheses explored:**
1. Frontend fetch/proxy misconfigured — ruled out; same 500 hit directly on `:3000`
2. Database / Prisma failure — ruled out; users endpoint returned seed data
3. Validation middleware crashing on query — verified via server log

**Root cause:** Express 5 makes `req.query` a getter-only property. `validate.ts` did `req[target] = result.data` after Zod parse, which throws:
`TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`
Every list request uses `validate(ticketQuerySchema, "query")`, so the list always 500'd (even with empty query).

**Fix:** In `backend/src/middleware/validate.ts`, assign body normally; for `query`/`params` use `Object.defineProperty` so handlers can still read `req.query`.

**Takeaway:** Express 4 → 5 broke a common “replace req.query with validated data” pattern. Always check framework major-version request object mutability when middleware mutates `req`.

---

_Add entries below as bugs are encountered during development._
