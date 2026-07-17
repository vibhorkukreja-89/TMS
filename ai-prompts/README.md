# AI Prompts — Grouped by Activity

This folder organises the AI interactions from building TMS **by activity**, so a reviewer can quickly see *how* AI was used rather than just the final output. It is a curated view — the complete chronological log (39 entries) lives in `../prompt-history/`.

For each notable prompt we capture: the **prompt** (text or summary), the **AI response summary**, what was **accepted**, what was **changed**, what was **rejected**, and **why**. This deliberately shows context-setting, iteration, review of AI output, correction of wrong suggestions, stack-specific guidance, and testing/debugging prompts.

## Index

| File | Activity | Source prompts |
|------|----------|----------------|
| `00-context-setting-and-planning.md` | Setting project context; plan-before-code | 1, 2, 7 |
| `01-backend-scaffold-and-setup.md` | Backend scaffold, Prisma/DB, TS 7 config | 3, 4, 5, 6, 12 |
| `02-git-and-pr-workflow.md` | Git/PR automation and auth friction | 8, 9, 10, 11, 13, 30, 37 |
| `03-state-machine-and-tests.md` | Mandatory state-machine integration tests | 14, 16 |
| `04-frontend-design.md` | UI design decisions via iteration | 17, 18, 19, 20, 22, 23, 24, 25 |
| `05-frontend-implementation.md` | Building the frontend from the design | 26, 29, 32 |
| `06-debugging.md` | Real debugging sessions with runtime evidence | 27 (+ cross-refs to 3, 6) |
| `07-code-review.md` | AI-assisted self-review before PRs | 15, 28, 31, 38, 39 |
| `08-integration-and-polish.md` | E2E verification, persistence, service hygiene | 33, 34, 35 |
| `09-documentation-and-submission.md` | README, reflection, submission | 36, 37 |

## How context was managed responsibly

- Real secrets were never pasted into prompts — only `.env.example` placeholders were shared.
- Persistent project context was supplied via Cursor **rules** and `@`-mentions of specific files, not by dumping the whole repo.
- Every non-trivial AI suggestion was validated (tests to green, builds clean, bugs reproduced) before acceptance; several were rejected with reasons (see `07-code-review.md`).
