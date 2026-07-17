# Code Review Notes

> Each phase PR was self-reviewed before merge — partly via an AI code-reviewer pass and partly by manual reading against `CONVENTIONS.md`/`RULES.md` and the acceptance criteria. This document summarises the findings, what was fixed, and — importantly — what was deliberately *not* changed and why. Source prompts: `prompt-history` Prompts 15, 16, 28, 29, 31, 32, 38 and `ai-prompts/07-code-review.md`.

---

## AI-Assisted Review Summary

Reviews were run at three points, using an AI reviewer to get a first pass and then triaging its findings by hand:

**Phase 2 PR (state-machine tests) — Prompt 15.** The AI reviewer surfaced 5 findings against the fresh backend:
- **Medium:** `user.router` called the repository directly, bypassing the service layer — a module-boundary violation.
- **Medium:** `testUserId` was used without a guard, so a failed `beforeAll` would produce confusing downstream failures.
- **Low:** unnecessary optional chaining (`?.`) in test assertions.
- **Low:** a redundant type cast.
- **Info:** suggestion to use `--detectOpenHandles` for the open-handle warning.

*(The dedicated Bugbot subagent was unavailable at the time, so this was a manual + code-reviewer pass.)*

**Phase 3 PR (frontend) — Prompts 28 and 31.** Two review passes:
- No **Critical** issues either time.
- **Important:** TypeScript strict mode was not yet enabled on the frontend.
- **Important:** the comment draft was cleared even when submission failed (bad UX — the user loses their text).
- **Important:** ticket detail did not display `updatedAt`, which AC-3 expects.
- **Important:** potential request-race on rapid detail navigation (stale response overwriting newer state).
- Housekeeping: leftover Vite scaffold assets (`icons.svg` etc.) and Jest-dependency/lockfile churn to explain in the PR body.

**Phase 5 PR (final) — Prompt 38.** Reviewer verdict: ready to merge; only minor polish (tick the Definition-of-Done boxes in `acceptance-criteria.md`, and cite the specific "plan-before-code" prompt in the reflection).

---

## My Review Observations

Reading the code myself alongside the AI pass, the observations I weighted most:
- **The module boundary matters more than it looks.** The `user.router → repository` shortcut worked functionally but broke the "routes never touch Prisma" rule that keeps the architecture honest. Worth fixing even for a trivial read.
- **Error UX is a first-class requirement here, not polish.** AC-10 demands readable errors on every async path; the cleared-draft-on-failure and missing `updatedAt` issues were real acceptance-criteria gaps, not nitpicks.
- **Test isolation was under-specified.** The open-handle warning was a symptom; the real fix was proper test-DB isolation via `DATABASE_URL_TEST` rather than papering over it with `--detectOpenHandles`.
- **Strict TS should have been on from the first frontend commit.** Turning it on later surfaced a few narrowings that were quick but should not have accumulated.

---

## Changes Made After Review

| Finding | Change | PR |
|---------|--------|----|
| `user.router` bypassed the service layer | Added `user.service.ts`; router now delegates to the service (boundary restored) | #3 |
| `testUserId` unguarded | Added a guard that throws a clear message if `beforeAll` didn't set it | #3 |
| Redundant `?.` in assertions | Removed | #3 |
| Redundant cast | Removed | #3 |
| Open-handle warning | Replaced `--detectOpenHandles` with real `DATABASE_URL_TEST` test-DB isolation; added Jest `types` to tsconfig | #3 |
| Frontend not strict | Enabled TypeScript `strict` on the frontend; fixed the resulting narrowings | #4 |
| Comment draft cleared on failure | Clear the draft **only on success**; preserve the user's text on error | #4 |
| Missing `updatedAt` on detail (AC-3) | Rendered `updatedAt` in the detail view | #4 |
| Detail request race | Added a request-race guard so a stale response can't overwrite newer state | #4 |
| Content-Type set unconditionally | Set `Content-Type` only when a body is present | #4 |
| Leftover Vite scaffold assets | Removed unused assets (`icons.svg`, etc.) | #4 |
| Generic validation message | `fetchJson` now surfaces Zod per-field `details` (DD-20) | #4/#5 |
| DoD checkboxes unticked | Ticked all six Core Definition-of-Done boxes; cited the plan-before-code prompt in the reflection | #6 |

Every change was re-verified: backend changes were confirmed with `npm test` (15/15 still green); frontend changes with `npm run build` + lint and a manual pass over the affected screens.

---

## Suggestions Rejected (and why)

| Suggestion | Rejected because |
|------------|------------------|
| Add **axios** for the API client | Native `fetch` + a thin typed wrapper covers every need without a dependency; violates dependency discipline (DD-8). |
| Add **React Query / SWR** for data fetching | Excellent DX but unnecessary at Core scope; custom hooks give clear layering with no cache library (DD-15). |
| Use a **state-machine library (XState)** | Overkill for five states; a static `Record` map is more readable and directly testable (DD-3). |
| Introduce a **global "current user" session** in the header | Implies a logged-in user / fake auth; the spec de-scopes auth. Per-form `UserSelect` keeps authorship explicit without pretending to have login (DD-17). |
| Rely on **`--detectOpenHandles`** to quiet the Jest warning | Treats the symptom, not the cause; proper test-DB isolation is the correct fix. |
| Trust **frontend-only status filtering** to prevent illegal transitions | The state machine must be enforced server-side (422); the frontend map is UX only. Accepting this would defeat the core requirement. |
| Restart/kill running services casually during debugging | Risked disrupting an active terminal / the user's session; handled deliberately and only when needed (see Prompts 34–35). |

**Overall verdict at submission:** all Critical/Important findings addressed; remaining open items are explicitly-scoped stretch goals (unit tests, component tests, CI), not defects.
