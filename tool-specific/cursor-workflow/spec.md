# TMS — Full Specification

> **Assessment artifact** — detailed specification for the Support Ticket Management System.

---

## Business Context

A small internal application for managing support tickets. Users create, update, comment on, search, and progress tickets through a defined status lifecycle.

---

## Entities

### User (seeded only — no user-management UI)

```
id          UUID (PK)
name        String
email       String (unique)
role        Enum: AGENT | ADMIN
createdAt   DateTime
```

### Ticket

```
id          UUID (PK)
title       String (required, non-empty)
description String (optional)
priority    Enum: LOW | MEDIUM | HIGH | CRITICAL (required)
status      Enum: OPEN | IN_PROGRESS | RESOLVED | CLOSED | CANCELLED (default: OPEN)
assignedTo  UUID? (FK → User, nullable)
createdBy   UUID (FK → User, required)
createdAt   DateTime (auto)
updatedAt   DateTime (auto)
```

### Comment

```
id          UUID (PK)
ticketId    UUID (FK → Ticket, required)
message     String (required, non-empty)
createdBy   UUID (FK → User, required)
createdAt   DateTime (auto)
```

---

## Status State Machine

This is the highest-judgment piece of the submission. The backend enforces it; the frontend mirrors it for UX.

### Valid transitions

```
OPEN         → IN_PROGRESS     (start work)
IN_PROGRESS  → RESOLVED        (work complete)
RESOLVED     → CLOSED          (confirmed resolved)
OPEN         → CANCELLED       (won't do before starting)
IN_PROGRESS  → CANCELLED       (abandoned mid-work)
```

### Invalid transitions (all others)

All unlisted transitions are rejected with HTTP 422:
- `OPEN → RESOLVED` (skipping IN_PROGRESS)
- `OPEN → CLOSED` (skipping multiple)
- `IN_PROGRESS → OPEN` (reverse)
- `RESOLVED → IN_PROGRESS` (reverse)
- `CLOSED → *` (terminal — no exit)
- `CANCELLED → *` (terminal — no exit)

### Error response for invalid transition

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition ticket from OPEN to CLOSED"
  }
}
```

### Frontend behaviour

- Status change control must only show valid next states for the current status
- On 422 from the backend, display the error message clearly (not a generic "something went wrong")

---

## API Endpoints

### Tickets

```
GET    /api/tickets                  List tickets (supports ?search=&status=)
POST   /api/tickets                  Create ticket
GET    /api/tickets/:id              Get ticket detail (with comments)
PATCH  /api/tickets/:id              Update fields (title, description, priority, assignedTo)
PATCH  /api/tickets/:id/status       Change status (state machine enforced)
```

### Comments

```
POST   /api/tickets/:id/comments     Add comment to ticket
```

### Users (read-only — for assignee dropdowns)

```
GET    /api/users                    List users (for assignee selection)
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| Ticket.title | Required, min 1 char, max 255 chars |
| Ticket.priority | Required, must be LOW\|MEDIUM\|HIGH\|CRITICAL |
| Ticket.createdBy | Required, must be a valid user UUID |
| Ticket.assignedTo | Optional; if provided, must be a valid user UUID |
| Comment.message | Required, min 1 char |
| Comment.createdBy | Required, must be a valid user UUID |
| Status transition | Must be in the allowed set |

Backend rejects invalid input with HTTP 400 and a validation error response.

---

## Search and Filter

The `GET /api/tickets` endpoint supports:
- `?search=keyword` — keyword match on `title` and `description` (case-insensitive, partial match)
- `?status=OPEN` — filter by status (exact match, enum value)
- Both can be combined: `?search=login&status=IN_PROGRESS`

---

## Frontend Features

1. **Ticket list page** — table/card view of all tickets, search bar, status filter dropdown
2. **Create ticket form** — title, description, priority, assignee selector
3. **Ticket detail page** — all fields, comments thread, status change control, edit fields
4. **Error states** — every async operation shows loading and error feedback
5. **No auth UI** — user is assumed from a seeded user (hardcoded or selected from a dropdown in the UI)

---

## Database

- **PostgreSQL** as the persistent store
- **Prisma** for schema definition, migrations, and type-safe queries
- **Migration scripts** generated with `prisma migrate dev`
- **Seed data** in `backend/prisma/seed.ts`:
  - 3–5 seeded users (AGENT and ADMIN roles)
  - 5–10 sample tickets in various statuses
  - A few sample comments

---

## Non-Functional Requirements

- Data must persist across server restarts (no in-memory only solutions)
- Backend validates all input — frontend validation is additive, not trusted
- No secrets committed to the repository
- README provides complete setup instructions that work from a clean clone

---

## Stretch Goals (optional, evidence toward C1.1)

- [ ] Authentication (login/logout, JWT, protected routes)
- [ ] Filter by priority and assignee; sorting; pagination
- [ ] Unit tests + edge-case tests beyond the mandatory state machine integration tests
- [ ] Swagger / OpenAPI documentation
- [ ] Docker setup (`docker-compose.yml`)
- [ ] CI workflow (GitHub Actions)
- [ ] Role-based access (ADMIN vs AGENT)
