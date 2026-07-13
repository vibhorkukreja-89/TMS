# TMS — Cursor Project Context

> **Assessment artifact** — part of the Cursor tool-specific submission for the JS AI Capability Exercise.

---

## Project Summary

**Name:** Support Ticket Management System (TMS)  
**Type:** Full-stack web application  
**Purpose:** Internal system for managing support tickets through a defined lifecycle  
**AI Tool:** Cursor IDE with Claude Sonnet  

---

## How Project Context Is Provided to the AI

Cursor is configured with persistent project context through a layered approach documented in `../../tool-workflow.md` (Section 2):

### Layer 1 — Always-On Rules (`.cursor/rules/`)

Five rules are active in every session:

| Rule file | What it provides |
|-----------|-----------------|
| `prompt-recorder.mdc` | Auto-logs every prompt to `prompt-history/` |
| `tms-project-context.mdc` | Stack, directory layout, module boundaries |
| `tms-spec.mdc` | Entities, state machine, mandatory features |
| `tms-conventions.mdc` | API envelope, error handling, naming, TypeScript |
| `tms-artifacts.mdc` | Required lifecycle artifacts, PR template, update cadence |

One rule is file-triggered:

| Rule file | Trigger | What it provides |
|-----------|---------|-----------------|
| `tms-testing.mdc` | `**/*.test.ts`, `**/*.spec.ts` | State machine test coverage requirements |

### Layer 2 — Context Documents

Three documents provide full detail that rules reference:

- `PROJECT.md` — stack decisions, directory structure, module boundaries
- `CONVENTIONS.md` — complete coding style guide with examples
- `RULES.md` — non-negotiable hard constraints with rationale

### Layer 3 — Session-Level `@`-Mentions

When working on a specific module, relevant files are `@`-mentioned to scope the context:
- Working on the state machine → `@backend/src/services/ticket-service.ts`
- Working on the UI → `@frontend/src/pages/TicketList.tsx`

### Layer 4 — Skills

Project-level skills (`.cursor/skills/`) encode reusable AI workflows from `tool-workflow.md`:
- `tms-requirement-analysis` — how to use AI to surface gaps in requirements
- `tms-planning` — how to drive planning/design sessions with AI
- `tms-debugging` — structured debugging protocol
- `tms-code-review` — pre-PR self-review checklist

---

## Stack Decisions and Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | React + TypeScript | Team standard; strong typing for API integration |
| Build tool | Vite | Fast HMR, minimal config overhead |
| Backend runtime | Node.js + Express + TypeScript | Consistent language across stack; full control |
| Database | PostgreSQL | Relational data with clear relationships; ACID guarantees matter for state machine |
| ORM | Prisma | Type-safe queries generated from schema; migrations first-class |
| Validation | Zod | TypeScript-native; one schema for both parse + type inference |
| Testing | Jest + Supertest | Integration-focused; straightforward HTTP testing |

---

## Key Technical Constraints

1. State machine enforced in `TicketService` — backend only, never trusted from frontend
2. All DB access through `repositories/` layer — no Prisma elsewhere
3. Standard API envelope on every response: `{ data }` or `{ error: { code, message } }`
4. `.env` gitignored; `.env.example` committed
5. TypeScript strict mode on both sides
