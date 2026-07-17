# Reflection

> Post-project reflection on building TMS with Cursor. Complements the prompt-by-prompt reflection in `docs/reflection.md`; this version is organised around the submission questions.

---

## What I Built

A full-stack Support Ticket Management System: a React + TypeScript frontend, a Node + Express + TypeScript REST API, and a PostgreSQL database accessed through Prisma. Users create, list, search/filter, view, update, and comment on tickets, and progress them through a strictly-enforced five-state status lifecycle. The defining feature is the **status state machine**, enforced only on the backend (a static transition map in the ticket service), returning **422 `INVALID_TRANSITION`** for illegal moves and mirrored on the frontend for UX only. The backend uses a clean routes → services → repositories layering, a single response envelope, Zod validation on every request, and a central error handler. Correctness of the state machine is proven by a **15-test Jest + Supertest integration suite (15/15 passing)**. The work was delivered in six phased PRs (#1–#6) with lifecycle artifacts (requirement analysis, design decisions, debugging log, reflection) maintained as I went.

## How I Used AI (across the lifecycle)

- **Requirement analysis:** used AI to enumerate gaps, ambiguities, and edge cases ("what could go wrong / what's missing?") before writing code — this produced the auth/identity, 400-vs-422, and search-scope decisions.
- **Planning:** required a step-by-step plan *before* any scaffolding, constrained by `RULES.md`/`CONVENTIONS.md`; approved the plan, then executed it sub-task by sub-task.
- **Scaffolding & generation:** generated the backend layering, Prisma schema/seed, validators, routers, and the frontend hooks/components/pages from an approved design.
- **Testing:** generated the 15-case state-machine suite directly from the spec's transition table.
- **Debugging:** used AI to turn concrete runtime evidence (logs, `curl`, screenshots) into hypotheses for the TS7/Prisma-7/Express-5 issues.
- **Review:** ran an AI code-reviewer pass before each PR and triaged the findings.
- **Governance:** always-on Cursor rules injected project context; a prompt-recorder rule logged every prompt; skills encoded reusable analysis/planning/debugging/review workflows.

## What AI Helped With Most

Scaffolding the layered backend and producing a coherent frontend structure (hooks + typed fetch) from a design spec was where AI saved the most time — it turned an approved plan into consistent, convention-following boilerplate quickly. It was also excellent at **generating the state-machine test matrix** (all valid + representative invalid transitions with correct assertions) and at **converting review findings into concrete patches**. The plan-before-code prompt (Prompt 1), with pointers to specific task files and explicit "no new dependencies" constraints, produced better-than-expected output because it was given context and boundaries rather than a vague ask.

## What AI Got Wrong

The consistent failure mode was **bleeding-edge tooling that post-dates the model's training assumptions**:
- Assumed `jest.config.ts` + ts-jest would work under TypeScript 7 — it didn't (Bug 001).
- Wrote the Express-4 pattern of assigning `req.query = parsed`, which throws under Express 5's getter-only `req.query`, 500ing every list request (Bug 002).
- Reached for the zero-arg `new PrismaClient()` and default client path, both invalid under Prisma 7 (needs `@prisma/adapter-pg`; generated client moved).
- Assumed the old `baseUrl`/`paths` tsconfig shape (TS5102/TS5090 under TS 7).

It also occasionally drifted toward scope creep (auth, pagination, axios, React Query, XState) unless reined in by the rules and `tasks.md`. And during frontend brainstorming, it leaned on a live "visual companion" server that kept dying, which slowed layout decisions until I fell back to text options.

## How I Validated AI Output

Nothing was accepted on trust:
- **Business logic** was validated by the integration suite, not by reading the code — a passing 15/15 run is the proof that the state machine behaves.
- **Bugs** were validated by *reproducing then re-running*: `curl` directly to `:3000` (bypassing the proxy) to isolate front vs back, reading the server log for the actual throw, applying the fix, and confirming the exact scenario now passes.
- **Builds** were validated with `npm run build` (both ends) and lint.
- **AI review findings** were triaged by hand against the conventions and acceptance criteria — some accepted, several rejected with documented reasons (see `code-review-notes.md`).
- **Persistence** was validated by restarting the backend and confirming data survived (Phase 4 evidence).

## What I Would Improve Next

- **Smoke-test the first list endpoint against Express 5 immediately** after adding query validation, instead of discovering the 500 when the UI landed.
- **Pin tooling assumptions in Phase 0** (TS major + Jest transformer + Express major + Prisma major) as explicit design decisions, so the "known footguns" are avoided rather than rediscovered.
- **Add a CI workflow early** (lint + `npm test` + frontend build) and require `DATABASE_URL_TEST`.
- **Add automated CRUD/search integration tests and a small RTL suite for `StatusControl`** — the manual coverage there is honest but thin.
- **Keep phase PRs smaller and merge more aggressively** so `main` and `boilerplate` don't drift.
- **Write a one-page wireframe decision table before scaffolding the UI**, so brainstorming doesn't block on a flaky preview server.

## Reusable Workflow (prompts, rules, specs, templates)

Things I would carry into a real project:
- **Module-boundary rules** (routes/services/repositories; Prisma only in repositories) — they kept the architecture clean automatically.
- **A fixed API-envelope + error-code convention** — made frontend error handling trivial and consistent.
- **Prompt-history + design-decision logging** — cheap to maintain, invaluable for audits and this kind of assessment.
- **A per-phase PR cadence with a fixed PR template** (What / Why / Test evidence / AI usage) — real spec-to-code traceability.
- **The plan-before-code prompt pattern**: point at specific files, state hard constraints (no new deps), and require an approved plan before generation.
- **Skills** for requirement-analysis, planning, debugging, and code-review, so the workflow is repeatable rather than ad hoc.

Things I'd add: a "known stack footguns" rule (Express 5 `req.query`, TS 7 + Jest config, Prisma 7 adapter), and CI wired in from Phase 0.
