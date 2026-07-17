# Activity: Code Review (AI-assisted self-review)

Before every phase PR, an AI code-reviewer pass was run and its findings were triaged by hand. This shows **review of AI output** and **responsible rejection** of suggestions. Consolidated in `../code-review-notes.md`.

---

## Prompt 15 — Review the Phase 2 PR

**Prompt:** Do a PR review of the "Phase 2 — State Machine Integration Tests" PR.

**AI response summary:** Manual + code-reviewer pass over the backend. Found 2 medium (`user.router` bypasses the service layer; `testUserId` unguarded), 2 low (unnecessary optional chaining; redundant cast), and 1 info (`--detectOpenHandles`) finding. (The dedicated Bugbot subagent was unavailable.)

**Accepted (as findings to fix):** All five (fixed in Prompt 16).
**Rejected:** Using `--detectOpenHandles` as the actual fix — replaced with proper test-DB isolation.
**Why:** The module-boundary violation was the important one; a passing test suite hid an architecture smell that the review caught.

---

## Prompt 28 — Review the Phase 3 changes

**Prompt:** Do a code review of the recent changes.

**AI response summary:** Reviewed the Phase 3 frontend + the `validate` fix. No Critical issues; Important: enable strict TS and fix the comment draft being cleared on a failed submit before opening the PR.

**Accepted:** Both Important findings (applied in Prompt 29).
**Rejected:** —.
**Why:** Both were real UX/typing concerns tied to acceptance criteria, not cosmetics.

---

## Prompt 31 — Review PR #4

**Prompt:** Do a PR review for #4 "Phase 3 — Frontend Foundation".

**AI response summary:** Reviewed PR #4 via code-reviewer. No Critical issues; Important: show `updatedAt` on the detail view (AC-3) and clarify the backend Jest lockfile churn before merge.

**Accepted:** Both (applied in Prompt 32).
**Rejected:** —.
**Why:** Caught an actual AC-3 gap (`updatedAt` not displayed) — a functional miss, not style.

---

## Prompts 38 & 39 — Review and finalise the submission PR

**Prompts:** P38 "Do the PR review for 'Phase 5 — Final Submission'"; P39 "Only fix: check the Definition of Done boxes in acceptance-criteria.md (outcomes are done; boxes still `[ ]`)".

**AI response summary:** Reviewed PR #6 — ready to merge, only minor polish (tick the DoD boxes; cite the plan-before-code prompt in the reflection). P39 then ticked all six Core Definition-of-Done boxes and pushed.

**Accepted:** The polish items.
**Rejected:** No substantive changes were needed — the reviewer explicitly declined to invent issues.
**Why:** Demonstrates a clean final gate: the review confirmed readiness and only administrative accuracy (checkboxes, a citation) remained. The scope of P39 was deliberately constrained ("only fix …") to avoid last-minute churn.
