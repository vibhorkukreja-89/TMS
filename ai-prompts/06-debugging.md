# Activity: Debugging (with runtime evidence)

The debugging prompts are where AI needed the most correction — and where sharing **real runtime evidence** (logs, `curl`, screenshots) rather than asking for another speculative edit made the difference. Full write-ups in `../debugging-notes.md`.

---

## Prompt 27 — Landing page shows "An unexpected error occurred"

**Prompt:** I see "An unexpected error occurred" on the landing page as soon as I open it.

**AI response summary:** Root-caused it to **Express 5's read-only `req.query`**: the validation middleware did `req.query = parsed`, which throws `Cannot set property query … which has only a getter`, 500ing every ticket-list request (even with an empty query). Fixed via `Object.defineProperty`; documented Bug 002 / DD-19.

**Accepted:** The `Object.defineProperty` fix.
**Changed:** Middleware no longer assigns to `req.query`/`req.params`.
**Rejected:** The original Express-4 "replace `req.query` with validated data" pattern (an outdated AI default).
**Why (and how it was caught):** I isolated it with runtime evidence — `curl` directly to `:3000/api/tickets` reproduced the 500 (ruling out the proxy), `/api/users` worked (ruling out the DB), and the **server log** showed the actual `TypeError`. The fix came from that evidence, not from guessing at the React code. This is the clearest case of correcting a wrong AI assumption using observation.

---

## Cross-referenced debugging prompts

Two earlier issues were also debugging sessions, logged in full under other activities but part of the debugging story:

- **Prompt 3 (TS7 tsconfig, TS5102/TS5090)** — fixed by relative `paths` + removing `baseUrl`. See `01-backend-scaffold-and-setup.md` and `debugging-notes.md` Issue 3.
- **Prompt 6 (Prisma `P1010` access denied)** — environmental: placeholder `DATABASE_URL`. See `01-backend-scaffold-and-setup.md` and `debugging-notes.md` Issue 4.
- **Bug 001 (`jest.config.ts` won't load under TS 7)** — surfaced during Prompt 14; fixed with CJS `jest.config.js`. See `debugging-notes.md` Issue 1.

**Common lesson (recorded in `reflection.md`):** when a framework/tooling *major version* changes, the AI's training-era defaults are the prime suspect; diagnose from real errors and pin the assumption as a design decision.
