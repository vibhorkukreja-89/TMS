# Candidate Information

| Field | Value |
|-------|-------|
| **Name** | Vibhor Kukreja |
| **Role** | Software Engineer (Full-Stack) |
| **Primary Technology Stack** | React + TypeScript (frontend) · Node.js + Express + TypeScript (backend) · PostgreSQL + Prisma ORM |
| **Primary AI Tool Used** | Cursor IDE (Claude Sonnet), driven with project-scoped rules, skills, and prompt logging |
| **Project Option Selected** | Support Ticket Management System (TMS) — JS AI Capability Exercise |
| **Assessment Start Date** | 2026-07-13 |
| **Submission Date** | 2026-07-17 |
| **Repository** | `github.com/vibhorkukreja-89/TMS` (work delivered on `boilerplate` branch, phased PRs #1–#6) |

---

## Project Summary

The Support Ticket Management System is a small, internal, full-stack web application for managing the lifecycle of support tickets. Users (support agents/admins, seeded — no login) can:

- **Create** tickets with a title, optional description, required priority, and an optional assignee.
- **List** all tickets with keyword **search** (case-insensitive, on title + description) and **status filtering**.
- **View** ticket detail including all fields, timestamps, and a threaded **comment** history.
- **Update** ticket fields (title, description, priority, assignee).
- **Progress** tickets through a strictly-enforced **status state machine**.
- **Comment** on tickets.

The centrepiece and highest-judgment element of the project is the **status state machine**, which is enforced exclusively on the backend:

```
OPEN         → IN_PROGRESS | CANCELLED
IN_PROGRESS  → RESOLVED    | CANCELLED
RESOLVED     → CLOSED
CLOSED       → (terminal — no exit)
CANCELLED    → (terminal — no exit)
```

Any transition outside this map is rejected with **HTTP 422** and the error body `{ error: { code: "INVALID_TRANSITION", message: "Cannot transition from X to Y" } }`. The frontend mirrors the same map for UX (it only offers valid next states) but never acts as the source of truth — the backend always re-validates.

The backend is organised as a strict three-layer architecture — **routes → services → repositories** — with all database access confined to repositories, all business logic (including the state machine) confined to services, and thin routes that only validate input, delegate, and shape the response. All responses follow a single envelope (`{ data }` / `{ error: { code, message } }`), all input is validated with Zod, and all errors bubble to a single central error-handler middleware.

Data persists in PostgreSQL via Prisma (migrations + seed), satisfying the "survives a restart" requirement. Correctness of the state machine is proven by a mandatory **15-test Jest + Supertest integration suite** (5 valid transitions → 200, 9 invalid → 422, 1 malformed status value → 400).

## Tools Used

| Category | Tool | Purpose |
|----------|------|---------|
| AI assistant | **Cursor IDE (Claude Sonnet)** | Requirement analysis, planning, code generation, debugging, and self-review |
| AI governance | **Cursor Rules** (`.cursor/rules/`) | Always-on project context, conventions, artifact cadence, testing standards, and a prompt-recorder that logs every prompt |
| AI workflows | **Cursor Skills** (`.cursor/skills/`) | Reusable requirement-analysis, planning, debugging, and code-review playbooks |
| Language | **TypeScript** (strict mode, both ends) | End-to-end type safety |
| Frontend | **React 19 + Vite** | UI, fast HMR; native `fetch` (no axios) |
| Routing | **react-router-dom** | `/`, `/tickets/new`, `/tickets/:id` |
| Backend | **Node.js + Express 5** | REST API |
| ORM / DB | **Prisma 7 + PostgreSQL** (`@prisma/adapter-pg`) | Type-safe queries, migrations, seed |
| Validation | **Zod** | Request validation + inferred DTO types |
| Testing | **Jest + Supertest + @swc/jest** | State-machine integration tests |
| TS runner | **tsx** | Dev server + seed scripts (TS7-compatible) |
| Lint | **oxlint** | Frontend linting |
| Version control | **Git + GitHub CLI (`gh`)** | Phased PR workflow |

## Setup Summary

Full instructions live in `README.md`. In short, from a clean clone:

```bash
# 1. Install
cd backend  && npm install
cd ../frontend && npm install

# 2. Databases (PostgreSQL running locally)
createdb tms_dev
createdb tms_test          # optional, recommended for tests

# 3. Backend env
cd backend && cp .env.example .env      # edit DATABASE_URL if needed

# 4. Migrate + generate client + seed
npx prisma generate
npx prisma migrate deploy
npm run db:seed            # 3 users, 6 tickets, 5 comments

# 5. Run API (terminal 1)
npm run dev                # http://localhost:3000 (health: /health)

# 6. Run UI (terminal 2)
cd frontend && npm run dev # http://localhost:5173 (proxies /api → :3000)

# Tests
cd backend && npm test     # expect 15/15 passing
```

`.env` is gitignored and never committed; only `.env.example` (placeholders) is tracked.
