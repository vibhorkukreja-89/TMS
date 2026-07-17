# Activity: Backend Scaffold & Setup

Building the backend surfaced repeated **stack-version mismatches** (TypeScript 7, Prisma 7). These prompts show stack-specific guidance and correcting the AI's outdated defaults.

---

## Prompt 3 — TS 7 path-alias build failure

**Prompt:** Getting TS5102 and TS5090 errors on the backend build — `baseUrl` removed in TypeScript 7, non-relative path not allowed.

**AI response summary:** Identified that TS 7 removed implicit `baseUrl` and disallows non-relative `paths` targets. Removed `baseUrl: "."` from `backend/tsconfig.json` and `frontend/tsconfig.app.json`; changed `"@/*": ["src/*"]` → `"@/*": ["./src/*"]`.

**Accepted:** The relative-path fix; both `npm run build` targets then passed.
**Changed:** —.
**Rejected:** The AI's initial (training-era) tsconfig used the old shape — that default was rejected in favour of the TS-7-correct form.
**Why:** Feeding the exact error codes let the AI give a precise, version-specific fix instead of a generic guess. Recorded in `debugging-notes.md` Issue 3.

---

## Prompt 4 — Missing dev-server entry point

**Prompt:** `npm run dev` throws "Cannot find module 'src/server.ts'" from backend.

**AI response summary:** Created minimal `backend/src/server.ts` and `app.ts` stubs so the dev runner has an entry point; added `.env.example` and noted that a real `DATABASE_URL` is required before the server will start.

**Accepted:** The stub entry points and the `.env.example`.
**Changed:** —.
**Rejected:** —.
**Why:** Small, targeted fix; the actionable note about needing a real `DATABASE_URL` pre-empted the next issue.

---

## Prompt 5 — Database layer (Prisma 7)

**Prompt:** (system: continue) — proceed with Phase 1.2 database setup.

**AI response summary:** Ran `prisma init` (Prisma 7, PostgreSQL); wrote `schema.prisma` with User/Ticket/Comment models using camelCase fields + snake_case `@map`; wrote `seed.ts` (3 users, 6 tickets, 5 comments, fictional data). Updated design decisions DD-10/11/12. Migration/seed blocked pending a real `DATABASE_URL`.

**Accepted:** Schema, naming convention (`@map` snake_case, `<relation>Id` FKs), cascade on comments, fictional seed data.
**Changed:** —.
**Rejected:** —.
**Why:** The schema followed the conventions exactly and used only fictional PII (R-SEC-2), which mattered for the security posture.

---

## Prompt 6 — Prisma migration access denied (P1010)

**Prompt:** `npx prisma migrate dev --name init` getting `P1010: User was denied access on the database`.

**AI response summary:** Diagnosed that the placeholder `DATABASE_URL` from `prisma init` was still in `backend/.env`. Guided finding local Postgres credentials, creating `tms_dev`, and setting the correct connection string.

**Accepted:** The credential/URL fix; migration `20260713130455_init` then applied and seed ran.
**Changed:** —.
**Rejected:** —.
**Why:** The failure was environmental, not code — the AI correctly avoided "fixing" code and pointed at the env. Recorded in `debugging-notes.md` Issue 4.

---

## Prompt 12 — Full Phase 1 backend implementation

**Prompt:** Proceed with Phase 1 — Backend Foundation. Go by completing sub-tasks in order.

**AI response summary:** Implemented all Phase 1 sub-tasks: `config.ts`, `db.ts` (PrismaClient via `@prisma/adapter-pg`), `errors.ts`, and the repository/service/validator/middleware/route layers, `app.ts`, `server.ts`, `seed.ts`. Fixed the Prisma 7 adapter requirement (DD-13) and the `ts-node`/TS 7 incompatibility by switching to `tsx` (DD-14). TypeScript compiled clean; 29 files committed.

**Accepted:** The layered implementation; the `@prisma/adapter-pg` and `tsx` decisions.
**Changed:** —.
**Rejected:** The zero-arg `new PrismaClient()` (invalid in Prisma 7) and `accelerateUrl` (needs a paid account) — replaced with the `pg.Pool` adapter.
**Why:** Doing sub-tasks in order kept the module boundaries intact and made the two tooling fixes traceable to specific design decisions. Recorded in `debugging-notes.md` Issue 4.
