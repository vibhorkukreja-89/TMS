# Reflection

> **Assessment artifact** — honest post-project reflection. Complete this last, after the Core is done.

---

## Prompts

Answer each question honestly and specifically. Reference your repository where helpful (commits, prompt history entries, debugging log).

---

### 1. Requirement understanding

How well did you understand the requirements before coding? Where did the AI help you see something you'd missed?

Phase 0 requirement analysis forced gap-finding before implementation, which helped. The biggest ambiguity was **user identity without auth** — the brief de-scopes login but still requires `createdBy`. We documented that early (`docs/requirement-analysis.md` Gap 1/5) and later locked **per-form `UserSelect`** rather than a fake global session (DD-17). AI was useful for enumerating edge cases (terminal states, search field scope, priority required-at-create). I still had to decide what was Core vs stretch; AI sometimes drifted toward auth or pagination unless constrained by rules/`tasks.md`.

---

### 2. AI across the lifecycle

Where in the lifecycle was AI most useful? Where did it fall short or require the most correction?

**Most useful:** scaffolding layered backend (routes → services → repositories), writing the state-machine integration suite, and producing a coherent frontend structure from the Phase 3 design (hooks + typed fetch). Also strong at turning review findings into concrete patches.

**Fell short:** environment/tooling mismatches under TypeScript 7 (jest config / ts-node — Bug 001) and Express 5 request mutability (Bug 002). Those needed runtime evidence from logs/curl, not another speculative edit. UI brainstorming without a live companion (when the preview server died) also slowed layout decisions until we fell back to text options.

---

### 3. A prompt that worked unusually well

Describe a specific prompt that produced better-than-expected output. What made it effective?

Asking to **produce a step-by-step plan before scaffolding** (early prompt history — Phase 1.1 plan with constraints from `RULES.md` / `CONVENTIONS.md`) worked well. Effectiveness came from: (1) pointing at specific task files, (2) stating hard constraints (no extra deps / native fetch), and (3) requiring a plan before code. That pattern carried into Phase 3 design → plan → implement and reduced rework.

---

### 4. A mistake the AI made

Describe a case where AI-generated code was wrong, misleading, or incomplete. How did you catch it, and what did you do?

**Bug 002:** validation middleware assigned `req.query = parsed`, which throws on Express 5 (`Cannot set property query … which has only a getter`). The frontend then showed “An unexpected error occurred” on every list load. Caught via screenshot + curl to `:3000` + backend log, not by reading the React code. Fix: `Object.defineProperty` for `query`/`params` (DD-19), documented in `docs/debugging-log.md`.

Earlier, **Bug 001** assumed `jest.config.ts` / ts-jest would work with TS7; it didn’t. Fix was CJS `jest.config.js` + `@swc/jest`.

---

### 5. The state machine

Explain your state machine implementation in your own words — the data structure, where it lives, and why invalid transitions return 422 specifically. Do not look at the code while writing this.

A static map from current status to an array of allowed next statuses lives in the ticket **service** (business rules), not in routes or the database. `changeStatus` loads the ticket, checks whether the requested status is in that list, and either updates via the repository or rejects. **422** is used because the request shape is valid (so not 400) but the transition violates a domain rule — “Unprocessable Entity” / business-rule failure in our conventions, with code `INVALID_TRANSITION`. The frontend mirrors the same map only for UX (`StatusControl`); the backend remains authoritative.

---

### 6. What you'd do differently

If you had to rebuild this project from scratch with the same tools, what would you change about your workflow, prompting strategy, or architecture?

- Smoke-test the **first list endpoint** against Express 5 immediately after adding query validation, instead of discovering it when the UI landed.
- Pin tooling assumptions earlier (TS major + Jest transformer + Express major) in Phase 0 design decisions.
- Keep phase PRs smaller and merge more aggressively so `main` and `boilerplate` don’t drift.
- For frontend, write a one-page wireframe decision table before scaffolding so brainstorming doesn’t block on a flaky companion server.

---

### 7. Reusability

Which parts of this Cursor setup (rules, skills, workflow) would you carry into a real project? What would you add?

**Carry:** module-boundary rules (routes/services/repositories), API envelope conventions, prompt-history / design-decision logging for audits, and mandatory PR cadence per phase for traceability.

**Add:** a CI workflow early (lint + `npm test` + frontend build), a required `DATABASE_URL_TEST`, and a short “known stack footguns” rule (Express 5 `req.query`, TS7 + Jest).

---

### 8. Responsible AI judgment

Was there anything you deliberately chose not to share with the AI? Any point where you overrode a suggestion because it was insecure or wrong?

Did not paste real credentials from `.env` into prompts; used `.env.example` placeholders. Overrode suggestions to add axios/React Query (dependency discipline), global fake “current user” (looks like incomplete auth), and killing/restarting services without care for an active terminal. Also rejected treating frontend-only status filtering as sufficient — invalid transitions must still be enforced server-side with 422.

---
