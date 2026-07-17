# Activity: State Machine & Integration Tests

The mandatory, highest-weight piece. These prompts show generating the test matrix from the spec and then hardening the suite in response to review.

---

## Prompt 14 — Generate the state-machine integration suite

**Prompt:** Proceed with Phase 2 — State Machine Integration Tests.

**AI response summary:** Installed `@swc/jest` (ts-jest is incompatible with TS 7), wrote a CJS `jest.config.js` and `ticket-status.test.ts` covering all 5 valid transitions (expect 200) and 9 invalid transitions (expect 422 `INVALID_TRANSITION`) plus a validation test (bogus status → 400). All 15 passed in <1s. Documented Bug 001 and opened **PR #3**.

**Accepted:** The full 15-case matrix, the `@swc/jest` + CJS config, and the assertion shape (`status`, `error.code`, `/Cannot transition/i`).
**Changed:** Config file had to be `.js` not `.ts` (the AI first tried `jest.config.ts`, which failed to load — see `06-debugging.md` / Bug 001).
**Rejected:** ts-jest (incompatible with TS 7).
**Why:** Deriving tests directly from the spec's transition table produced complete, correct coverage of the exact contract (200 vs 422 vs 400). This is the automated proof the whole submission leans on.

---

## Prompt 16 — Harden the suite after review

**Prompt:** Fix the changes required and update the PR.

**AI response summary:** Addressed all 5 review findings on the test/backend: added `user.service.ts` (so `user.router` stops calling the repository directly), added a `testUserId` guard, removed unnecessary optional chaining in assertions, removed a redundant cast, and replaced `--detectOpenHandles` with real `DATABASE_URL_TEST` isolation. Added Jest `types` to tsconfig. 15/15 still green; pushed to PR #3.

**Accepted:** All five fixes.
**Changed:** Test-DB isolation approach — from a diagnostic flag to a proper separate test database.
**Rejected:** Using `--detectOpenHandles` as the "fix" — it treats the symptom, not the cause.
**Why:** Shows iteration on *test quality* (isolation, boundary hygiene), not just getting to green. Detail in `code-review-notes.md` and `test-strategy.md`.
