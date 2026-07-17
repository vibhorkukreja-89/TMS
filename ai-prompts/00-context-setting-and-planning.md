# Activity: Context Setting & Planning

The project opened by giving the AI explicit context (task files, hard constraints) and demanding a plan **before** any code. This set the tone for the whole build: constrained, reviewable, plan-first.

---

## Prompt 1 — Plan-before-code for the scaffold

**Prompt (verbatim, abridged):**
> Use the tms-planning skill. I want to set up the boilerplate for both `frontend/` and `backend/` as described in Phase 1.1 of `@tool-specific/cursor-workflow/tasks.md`. **Before writing any code, produce a step-by-step plan** that covers: backend scaffold (package.json, tsconfig with path aliases, dev runner, folder structure routes/services/repositories/middleware/validators), `config.ts` using Zod to validate env vars, `.env.example`, and the frontend Vite (react-ts) scaffold with path aliases and a Vite proxy to the backend. Constraints from `@RULES.md` and `@CONVENTIONS.md`: no new dependencies beyond `@spec.md`.

**AI response summary:** Produced a 9-step, 5-commit plan for Phase 1.1 covering both ends, with two explicit tooling choices: `ts-node-dev` over `nodemon+ts-node`, and native `fetch` over axios.

**Accepted:** The plan structure, the folder layout, and the native-`fetch` decision.
**Changed:** `ts-node-dev` was later superseded by `tsx` once TypeScript 7's incompatibility surfaced (DD-14) — the plan was right for the intent, wrong on the specific runner.
**Rejected:** Nothing at this stage.
**Why:** Requiring a plan first, pointing at *specific* files, and stating hard constraints (no new deps) is what made the output usable — it is the single most effective prompt pattern in the project (cited in `reflection.md`).

---

## Prompt 2 — Execute the approved plan

**Prompt:** (system: continue) — proceed with Phase 1.1 scaffold implementation after the plan was approved.

**AI response summary:** Implemented all 9 scaffold steps: backend `package.json` + deps, tsconfig with path aliases, dev scripts, `src/` structure, Zod `config.ts`, `.env.example`, Vite react-ts frontend, `tsconfig.app.json` aliases, and `vite.config.ts` proxy. Updated `tasks.md` and `design-decisions.md`.

**Accepted:** The full scaffold.
**Changed:** tsconfig `paths`/`baseUrl` shape needed correcting for TS 7 immediately after (see `01-backend-scaffold-and-setup.md`, Prompt 3).
**Rejected:** Nothing.
**Why:** Executing only after explicit plan approval kept generation aligned with the agreed structure.

---

## Prompt 7 — Verify a phase is actually complete

**Prompt:** Check if "Phase 0 — Setup & Planning" is completed or if there is any pending item in the list.

**AI response summary:** Audited `tasks.md`, the docs artifacts, and the git log. Found three items marked pending were in fact complete (requirement-analysis, design-decisions, git init); the only genuinely open item was the Phase 0 PR. Updated checkboxes, committed Phase 0 artifacts, pushed the `boilerplate` branch, and drafted the PR description.

**Accepted:** The audit and the checkbox corrections.
**Changed:** — .
**Rejected:** —.
**Why:** Using AI to *audit progress against the task list* (not just to generate code) kept the artifacts honest and the phase gate meaningful. It also surfaced the PR-tooling auth friction handled in `02-git-and-pr-workflow.md`.
