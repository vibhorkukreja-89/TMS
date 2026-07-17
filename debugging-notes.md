# Debugging Notes

> Real debugging sessions from the build. Each entry follows: Problem → How I Investigated → How AI Helped → What I Validated → Final Fix. The running log lives in `docs/debugging-log.md`; this is the submission-facing summary of the most instructive issues.

---

## Issue 1 — `jest.config.ts` fails to load under TypeScript 7

### Problem
Running `npm test` in `backend/` failed before any test executed:
```
Jest: Failed to parse the TypeScript config file jest.config.ts
TypeError: Cannot read properties of undefined (reading 'fileExists')
```
The same shape of error had appeared earlier when trying to run TypeScript directly via `ts-node`.

### How I Investigated
- Confirmed `@swc/jest` and the transform were installed correctly — so the transform itself was not the failing piece.
- Reasoned about *when* the error fired: it happened while Jest was **loading its own config**, i.e. before any `transform` plugin could apply. That pointed at how Jest bootstraps a `.ts` config rather than at the test files.
- Correlated it with the earlier `ts-node` failure — same `ts.sys.fileExists` symptom, same root family.

### How AI Helped
I gave the assistant the exact error, the fact that `@swc/jest` was installed, and the earlier `ts-node` incident. It correctly identified that Jest parses `jest.config.ts` through the TypeScript compiler API (via `ts-node`/native TS) *before* the `transform` config is active, and that TypeScript 7 changed `ts.sys`, breaking `ts-node` 10.x. It proposed dropping the TS config in favour of a CJS config. I treated this as a hypothesis, not a fact, and verified it.

### What I Validated
- Renamed `jest.config.ts` → `jest.config.js` (CommonJS; `package.json` is `"type": "commonjs"`).
- Re-ran `npm test`: the config loaded and the suite executed — `15 passed, 15 total` in ~1s.
- Confirmed `.test.ts` files are still transformed by `@swc/jest` (TypeScript tests run fine), proving the fix was localised to the config-loading path.

### Final Fix
`jest.config.js` (CJS) instead of `jest.config.ts`. Documented as **Bug 001** in `docs/debugging-log.md` and captured as a tooling constraint (same root cause as DD-14: `ts-node` is incompatible with TS 7, hence `tsx` for the dev server/seed).
**Takeaway:** the Jest config file is not subject to the project's own `transform` — it must be natively loadable by Node. Under TS 7, always use `jest.config.js`/`.mjs`, never `.ts`.

---

## Issue 2 — Ticket list returns HTTP 500 (Express 5 read-only `req.query`)

### Problem
As soon as the frontend landing page opened, it showed a pink banner: **"An unexpected error occurred."** `GET /api/tickets` returned **HTTP 500**, while `GET /api/users` worked fine.

### How I Investigated
- Ruled out the frontend/proxy: hitting `http://localhost:3000/api/tickets` directly (bypassing Vite) reproduced the same 500 — so it was a backend fault, not a proxy or fetch problem.
- Ruled out the database/Prisma: `/api/users` returned seed data, so the connection and client were healthy.
- Read the backend server log, which showed the actual throw:
  `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`.
- Noticed the common factor: the list route is the one endpoint using `validate(ticketQuerySchema, "query")`, and it 500'd even with an empty query.

### How AI Helped
I shared the screenshot, the fact that `/api/users` worked, and the server-log `TypeError`. The assistant connected it to the Express 4 → 5 change that makes `req.query`/`req.params` getter-only, so the middleware line `req[target] = result.data` throws on assignment. Crucially, this diagnosis came from **runtime evidence** (the log), not from another speculative code edit — an earlier "just try changing X" style suggestion would not have found it.

### What I Validated
- Changed `validate.ts` to assign `body` normally but re-attach validated `query`/`params` via `Object.defineProperty`, so handlers still read `req.query`.
- Restarted the backend, reloaded the UI: the list rendered; direct `curl` to `:3000/api/tickets` returned `200` with the envelope.
- Confirmed body-validated routes (create/update/comment) were unaffected.

### Final Fix
`Object.defineProperty(req, target, { value, ... })` for `query`/`params` in `backend/src/middleware/validate.ts`. Documented as **Bug 002** in `docs/debugging-log.md` and as **DD-19**.
**Takeaway:** when a framework major version bumps, re-check any middleware that *mutates* the request object. The "replace `req.query` with validated data" pattern is an Express-4-ism that silently breaks under Express 5.

---

## Issue 3 — Backend build fails with TS5102 / TS5090 (path aliases under TypeScript 7)

### Problem
`npm run build` failed on both backend and frontend with TypeScript errors `TS5102` (`baseUrl` removed) and `TS5090` (non-relative paths not allowed in `paths`), so nothing compiled.

### How I Investigated
- Read the errors literally: TS 7 removed the implicit `baseUrl: "."` behaviour, and a `paths` entry like `"@/*": ["src/*"]` is now a non-relative target that TS rejects without a base.
- Checked both `tsconfig.json` (backend) and `tsconfig.app.json` (frontend) since both used the same alias pattern.

### How AI Helped
The assistant explained the TS 7 change and proposed making the `paths` targets relative and removing the obsolete `baseUrl`. I applied it and verified rather than assuming.

### What I Validated
- Removed `baseUrl: "."`; changed `"@/*": ["src/*"]` → `"@/*": ["./src/*"]` in both configs.
- Re-ran `npm run build` on backend and frontend — both compiled clean.

### Final Fix
Relative `paths` targets and no `baseUrl` (recorded in `prompt-history` Prompt 3). Also required `-r tsconfig-paths/register` / `tsx`'s alias handling at runtime so `@/` resolves outside the compiler too.
**Takeaway:** path-alias configuration is version-sensitive; pin and verify the `tsconfig` shape against the actual TypeScript major in use.

---

## Issue 4 — Prisma 7: `new PrismaClient()` is a type error / migration blocked

### Problem
Two Prisma-7 surprises: (a) the zero-arg `new PrismaClient()` no longer type-checks because the client now requires a driver adapter, and (b) `npx prisma migrate dev --name init` failed with `P1010: User was denied access on the database` (placeholder `DATABASE_URL` from `prisma init` still in `.env`).

### How I Investigated
- For (a), read the Prisma 7 generator output location (`src/generated/prisma`) and the constructor type signature, which now demands an `adapter` or `accelerateUrl`.
- For (b), inspected `.env` and recognised the connection string was still the `prisma init` placeholder, not a real local Postgres URL — hence the access-denied.

### How AI Helped
The assistant identified that Prisma 7's `prisma-client` generator dropped the implicit datasource-URL fallback and that `@prisma/adapter-pg` (wrapping a `pg.Pool`) is the official direct-Postgres path; and it walked through creating `tms_dev` and setting a correct `DATABASE_URL`. I rejected the alternative it floated (`accelerateUrl`, which needs a paid Prisma Accelerate account) as inappropriate for a local project.

### What I Validated
- Initialised `PrismaClient` with `@prisma/adapter-pg` + a shared `pg.Pool` singleton in `db.ts`; the backend compiled and connected.
- Set a real local `DATABASE_URL`, created `tms_dev`, re-ran `migrate dev` — migration `20260713130455_init` applied; `npm run db:seed` populated 3 users / 6 tickets / 5 comments.

### Final Fix
`@prisma/adapter-pg` adapter (DD-13), generated client at `src/generated/prisma` (DD-12), correct `DATABASE_URL`. `accelerateUrl` rejected with reason.
**Takeaway:** treat major ORM upgrades as breaking; the "obvious" zero-arg constructor and default client path from training data were both wrong for Prisma 7 — the real docs/types were the authority.
