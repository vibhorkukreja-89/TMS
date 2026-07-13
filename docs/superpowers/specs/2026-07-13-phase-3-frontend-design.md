# Phase 3 — Frontend Foundation Design

> Date: 2026-07-13  
> Status: Approved  
> Scope: Phase 3 only (types, API client, hooks, pages, components, routing). Phase 4 covers E2E polish.

---

## Goals

Build a working React + TypeScript UI that exercises the existing backend:

1. List tickets with keyword search and status filter  
2. Create a ticket  
3. View/edit ticket detail, change status via state machine, add comments  
4. Surface API errors clearly (400 / 422 / network)

No authentication. No new frontend dependencies beyond `react-router-dom` (already installed). Native `fetch` only (DD-8).

---

## Decisions locked in brainstorming

| Topic | Choice |
|-------|--------|
| Ticket list layout | Compact rows (`TicketCard` as a row, not a bordered card grid) |
| Current user | Per-form `UserSelect` for `createdById` on create ticket and add comment (no global session user) |
| Detail layout | Split: main column = edit fields + comments; side panel = status + `StatusControl` |
| Architecture | Custom hooks + typed fetch wrappers (Approach 1) |

---

## Architecture

```
Pages → Hooks → api/ (typed fetch) → Vite proxy → /api/* → Express backend
                  ↑
               types/
```

| Layer | Path | Responsibility |
|-------|------|----------------|
| Types | `frontend/src/types/` | Domain + API envelope types |
| HTTP | `frontend/src/api/client.ts` | Shared `fetchJson`; unwrap `{ data }` / throw on `{ error }` |
| API | `frontend/src/api/tickets.api.ts`, `users.api.ts` | Thin endpoint wrappers |
| Hooks | `frontend/src/hooks/` | Loading/error/data + search/filter/mutation state |
| Pages | `frontend/src/pages/` | Route-level composition; no raw `fetch` |
| Components | `frontend/src/components/` | Reusable UI pieces |
| Styles | `frontend/src/*.css` / co-located CSS | Plain CSS; no CSS framework |

### Scaffold gaps to finish (tasks 3.1 incomplete in practice)

- Configure Vite `server.proxy` → backend (e.g. `http://localhost:3000`)
- Enable `@/` path alias in `tsconfig.app.json` + `vite.config.ts`
- Replace Vite starter `App.tsx` with router shell

---

## Types

Mirror backend JSON (Prisma relation shape already returned by API):

```typescript
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TicketStatus;
  createdById: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  comments?: Comment[];
}

interface Comment {
  id: string;
  ticketId: string;
  message: string;
  createdById: string;
  createdAt: string;
  createdBy?: UserSummary;
}

interface ApiSuccess<T> {
  data: T;
  meta?: { total: number };
}

interface ApiErrorBody {
  error: { code: string; message: string };
}
```

`ApiClientError` class: `{ code, message, status }` thrown by `fetchJson`.

---

## API client

| Function | Method | Path |
|----------|--------|------|
| `listTickets({ search?, status? })` | GET | `/api/tickets` |
| `getTicket(id)` | GET | `/api/tickets/:id` |
| `createTicket(body)` | POST | `/api/tickets` |
| `updateTicket(id, body)` | PATCH | `/api/tickets/:id` |
| `changeTicketStatus(id, status)` | PATCH | `/api/tickets/:id/status` |
| `addComment(ticketId, body)` | POST | `/api/tickets/:id/comments` |
| `listUsers()` | GET | `/api/users` |

Base URL: empty string in browser (relative `/api/...` via Vite proxy).

---

## Hooks

| Hook | Behaviour |
|------|-----------|
| `useTickets()` | Holds `search` + `status` filter state; fetches list on change; exposes `{ tickets, loading, error, search, setSearch, status, setStatus, refetch }` |
| `useTicketDetail(id)` | Loads ticket (with comments); exposes `{ ticket, loading, error, refetch }` |
| `useUsers()` | Loads users once for dropdowns |
| `useMutation(fn)` | Generic `{ mutate, loading, error, reset }` for create/update/status/comment |

---

## Components

| Component | Behaviour |
|-----------|-----------|
| `TicketCard` | Compact row: title, `StatusBadge`, priority, assignee name; `Link` to `/tickets/:id` |
| `StatusBadge` | Coloured status label |
| `StatusControl` | Renders buttons only for valid next statuses from the transition map (same as backend DD-3); calls `onChange(status)`; disabled while pending; shows nothing actionable for `CLOSED` / `CANCELLED` |
| `CommentThread` | Renders comments; form with message + `UserSelect` (`createdById`) |
| `ErrorMessage` | Displays user-readable `message`; optionally show `code` for `INVALID_TRANSITION` |
| `UserSelect` | `<select>` of seeded users from `useUsers` |

### Status transition map (frontend UX mirror)

```
OPEN         → IN_PROGRESS, CANCELLED
IN_PROGRESS  → RESOLVED, CANCELLED
RESOLVED     → CLOSED
CLOSED       → []
CANCELLED    → []
```

Backend remains source of truth; UI never offers invalid options; 422 still handled via `ErrorMessage`.

---

## Pages & routing

| Route | Page |
|-------|------|
| `/` | `TicketListPage` — search, status filter, “New ticket”, compact row list |
| `/tickets/new` | `CreateTicketPage` — title, description, priority, assignee, createdBy (`UserSelect`); navigate to detail on success |
| `/tickets/:id` | `TicketDetailPage` — split layout |

**TicketDetailPage layout**

- Left: editable title/description/priority/assignee + Save; then `CommentThread`
- Right: current `StatusBadge` + `StatusControl`; status mutation errors shown adjacent to the control

---

## Error & loading behaviour

- Every async surface shows loading state
- `fetchJson` maps envelope errors → `ApiClientError`
- Network/offline → friendly connection message (AC-10)
- 400 validation → form-level `ErrorMessage` (and empty-title client check on create for UX only)
- 422 `INVALID_TRANSITION` → clear message next to status control
- No silent catches; no raw JSON dumps in the UI

---

## Styling

- Functional, clean internal-tool look
- Plain CSS variables for status/priority colours
- No card-heavy dashboard chrome on the list (compact rows)
- Responsive: side panel stacks under main column on narrow viewports

---

## Testing in Phase 3

- Manual verification against running backend + seed data
- Mandatory state-machine integration tests remain backend-only (Phase 2)
- Phase 4: structured E2E checklist (create → list → detail → update → status → comment → search; invalid transition UI; validation UI)

---

## Explicit non-goals (Phase 3)

- Auth / JWT
- Global current-user context
- Pagination, priority filter, sorting
- React Query / axios / UI component libraries
- Shared code packages across frontend/backend

---

## File checklist (implementation)

```
frontend/
  vite.config.ts              # proxy + @ alias
  tsconfig.app.json           # paths
  src/
    main.tsx                  # BrowserRouter
    App.tsx                   # Routes
    types/index.ts
    api/client.ts
    api/tickets.api.ts
    api/users.api.ts
    hooks/useTickets.ts
    hooks/useTicketDetail.ts
    hooks/useUsers.ts
    hooks/useMutation.ts
    pages/TicketListPage.tsx
    pages/CreateTicketPage.tsx
    pages/TicketDetailPage.tsx
    components/TicketCard.tsx
    components/StatusBadge.tsx
    components/StatusControl.tsx
    components/CommentThread.tsx
    components/ErrorMessage.tsx
    components/UserSelect.tsx
    lib/status-transitions.ts # VALID_TRANSITIONS + getNextStatuses()
```

---

## Acceptance mapping

| Criterion | How Phase 3 satisfies it |
|-----------|--------------------------|
| AC create / list / detail / update | Pages + API wrappers |
| AC status transitions | `StatusControl` + change-status API |
| AC comments | `CommentThread` |
| AC search/filter | `useTickets` query params |
| AC-10 errors | `ErrorMessage` + `ApiClientError` |
| Invalid transition UX | Offer only valid next; display 422 message |
