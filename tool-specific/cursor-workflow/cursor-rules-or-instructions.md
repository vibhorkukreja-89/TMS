# TMS — Cursor Rules and Instructions

> **Assessment artifact** — documents the persistent Cursor context setup for TMS.

---

## Overview

This project uses Cursor IDE with a layered context strategy: always-on rules provide persistent project context in every session; file-triggered rules apply when relevant files are open; project-level skills encode reusable AI workflows.

All rules are in `TMS/.cursor/rules/`. They load automatically — no manual configuration needed per session.

---

## Rules in `.cursor/rules/`

### `prompt-recorder.mdc`

**Scope:** `alwaysApply: true`  
**Purpose:** Automatically appends every user prompt and a 2-line response summary to `prompt-history/history-NNN.md` after each response. Max 10 entries per file, then auto-increments. Satisfies the full prompt history requirement without manual effort.

---

### `tms-project-context.mdc`

**Scope:** `alwaysApply: true`  
**Purpose:** Establishes the project stack, directory layout, and module boundaries for the AI in every session. Prevents the agent from making structural decisions that violate the architecture (e.g. putting Prisma calls in service files, or adding undocumented dependencies).

Key content:
- Stack summary (React + TypeScript, Node.js + Express, PostgreSQL, Prisma)
- Full directory map
- Module boundary rules (repos only for DB, services only for logic, thin routes)
- Pointers to `spec.md`, `CONVENTIONS.md`, `RULES.md`

---

### `tms-spec.mdc`

**Scope:** `alwaysApply: true`  
**Purpose:** Keeps the core specification — entities, state machine, and feature list — in the agent's context at all times. Ensures every session understands what is being built without re-explaining it, and specifically keeps the state machine rules visible so they are never accidentally violated.

Key content:
- Entity field lists (User, Ticket, Comment)
- State machine transition table (valid and invalid)
- Core feature list
- Pointer to `acceptance-criteria.md`

---

### `tms-conventions.mdc`

**Scope:** `alwaysApply: true`  
**Purpose:** Enforces consistent code style and API contracts across all sessions. The agent generates code that matches existing patterns without being reminded every time.

Key content:
- Standard API response envelope shape
- HTTP status code guide
- Error handling pattern (no silent swallows, central handler)
- Validation approach (Zod, middleware-based)
- Naming conventions (files, types, routes, DB columns)
- TypeScript strict mode requirements
- Environment variable rules

---

### `tms-testing.mdc`

**Scope:** `globs: **/*.test.ts, **/*.spec.ts, **/*.test.tsx, **/*.spec.tsx`  
**Purpose:** Provides testing standards specifically when working on test files. Ensures the mandatory state machine integration tests are comprehensive, that test isolation is correct, and that tests cover behaviour rather than implementation details.

Key content:
- Complete list of valid and invalid transitions to cover
- Assertion shape for 422 responses
- Test structure template
- What to test vs what not to test
- Test database isolation requirements

---

### `tms-artifacts.mdc`

**Scope:** `alwaysApply: true`  
**Purpose:** Keeps the artifact requirement visible in every session, so lifecycle documentation is updated during development rather than scrambled together at the end. Provides the PR description template.

Key content:
- Full directory map of required artifacts
- Update cadence for each artifact
- PR description template (What / Why / Test evidence / AI usage)

---

## Skills in `.cursor/skills/`

Project-level skills encode the AI workflows from `tool-workflow.md`. They are invoked by name (e.g. "use the tms-planning skill") or referenced in prompts.

| Skill | When to use |
|-------|------------|
| `tms-requirement-analysis` | When starting a feature — surface gaps and derive acceptance criteria |
| `tms-planning` | When about to implement a module — generate step-by-step plan before coding |
| `tms-debugging` | When something breaks — structured hypothesis-first debugging |
| `tms-code-review` | Before any commit or PR — AI self-review pass |

---

## How Context Is Loaded per Session

```
Session start
  → Cursor loads all alwaysApply rules (4 rules always active)
  → Agent has: stack, spec, state machine, conventions, artifact requirements
  
Working on test files
  → tms-testing.mdc activates via glob match
  → Agent has: full test coverage requirements, assertion patterns, isolation rules

Invoking a skill
  → User says "use the tms-planning skill" or "use tms-debugging skill"
  → Agent reads the SKILL.md file and follows its instructions
```

---

## Design Decisions in This Setup

**Why split into multiple rules instead of one big rule?**  
One-concern-per-rule means each rule stays under 50 lines, loads quickly, and can be reasoned about independently. A single 200-line rule is harder to maintain and more likely to be partially ignored by the model.

**Why always-apply rather than file-triggered for most rules?**  
The spec, conventions, and artifact requirements are relevant in almost every session. Making them always-on avoids the risk of working in a context that has drifted from the project's constraints.

**Why a file-triggered rule for testing?**  
Testing standards are detailed enough to warrant their own rule, but they only add noise when working on non-test files. The glob trigger is the right trade-off.

**Why project-level skills rather than just more rules?**  
Skills encode multi-step AI workflows (not just constraints). They are invoked explicitly when needed, not passively loaded. This keeps the always-on context lean.
