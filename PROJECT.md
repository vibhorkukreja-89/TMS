# TMS — Support Ticket Management System

## Overview

An internal support ticket management system built as part of the JS AI Capability Exercise. Internal users create, update, comment on, search, and progress tickets through a defined lifecycle (state machine).

**AI tool:** Cursor IDE (Claude Sonnet)  
**Workflow reference:** `../tool-workflow.md`  
**Assessment artifacts:** `tool-specific/cursor-workflow/`

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript | Bundled with Vite |
| Backend | Node.js 20 + Express 4 + TypeScript | REST API |
| Database | PostgreSQL 15+ | Persistent, survives restart |
| ORM | Prisma 5+ | Migrations, seed, type-safe queries |
| Validation | Zod | Backend schema validation |
| Testing | Jest 29 + Supertest | Integration tests mandatory |

---

## Directory Structure

```
TMS/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # Reusable UI components (TicketCard, StatusBadge, etc.)
│   │   ├── pages/             # Route-level views
│   │   ├── hooks/             # Custom React hooks (useTickets, useTicketDetail, etc.)
│   │   ├── api/               # Typed fetch wrappers for the backend API
│   │   └── types/             # Shared TypeScript types (mirrors backend DTOs)
│   ├── index.html
│   └── vite.config.ts
│
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── routes/            # Express routers — thin, no domain logic
│   │   ├── services/          # Business logic (TicketService, state machine)
│   │   ├── repositories/      # All Prisma calls (TicketRepository, CommentRepository)
│   │   ├── middleware/        # Error handler, request logging, validation middleware
│   │   └── validators/        # Zod schemas for request bodies
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   ├── migrations/        # Auto-generated Prisma migrations
│   │   └── seed.ts            # Seed users and sample tickets
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                      # Lifecycle artifacts (see tms-artifacts rule)
│   ├── requirement-analysis.md
│   ├── design-decisions.md
│   ├── debugging-log.md
│   └── reflection.md
│
├── tool-specific/
│   └── cursor-workflow/       # Required Cursor submission artifacts
│
├── prompt-history/            # Auto-maintained prompt log
├── PROJECT.md                 # This file
├── CONVENTIONS.md             # Coding conventions
├── RULES.md                   # Hard constraints
└── README.md                  # Setup instructions (created during implementation)
```

---

## Module Boundaries

These are enforced by the `tms-project-context` Cursor rule and must never be crossed:

1. **`repositories/`** — the only layer that calls Prisma. No Prisma imports elsewhere.
2. **`services/`** — the only layer with business logic. Calls repositories, enforces the state machine.
3. **`routes/`** — thin handlers: validate request → call service → send response. No SQL, no domain logic.
4. **Frontend** — communicates with the backend only via HTTP. No shared runtime code.

---

## Data Model Summary

See `tool-specific/cursor-workflow/spec.md` for the full spec.

| Model | Key fields |
|-------|-----------|
| User | id, name, email, role |
| Ticket | id, title, description, priority, status, assignedTo, createdBy, timestamps |
| Comment | id, ticketId, message, createdBy, createdAt |

**Status state machine:** Open → In Progress → Resolved → Closed; Open/In Progress → Cancelled.

---

## Environment Setup

See `README.md` for step-by-step local setup instructions (created during implementation).
