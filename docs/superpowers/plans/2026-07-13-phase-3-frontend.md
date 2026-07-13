# Phase 3 — Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working React TMS UI (list, create, detail with edit/status/comments) against the existing Express API.

**Architecture:** Pages → hooks → typed `fetch` wrappers → Vite proxy → `/api/*`. Comments are loaded via `GET /api/tickets/:id/comments` in parallel with the ticket (backend `getTicketById` does not include comments).

**Tech Stack:** React 19, Vite 8, TypeScript, react-router-dom 7, native fetch, plain CSS.

**Spec:** `docs/superpowers/specs/2026-07-13-phase-3-frontend-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `frontend/vite.config.ts` | React plugin, `@` alias, `/api` proxy → `:3000` |
| `frontend/tsconfig.app.json` | `paths`: `@/*` → `src/*` |
| `frontend/src/types/index.ts` | Domain + envelope types + `ApiClientError` |
| `frontend/src/api/client.ts` | `fetchJson` |
| `frontend/src/api/tickets.api.ts` | Ticket + comment endpoints |
| `frontend/src/api/users.api.ts` | `listUsers` |
| `frontend/src/lib/status-transitions.ts` | Valid next statuses |
| `frontend/src/hooks/*` | Data + mutation hooks |
| `frontend/src/components/*` | UI pieces from design |
| `frontend/src/pages/*` | List, create, detail |
| `frontend/src/App.tsx` | Routes |
| `frontend/src/main.tsx` | `BrowserRouter` |
| `frontend/src/index.css` | App theme |

---

### Task 1: Scaffold — Vite proxy + path aliases

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.app.json`

- [ ] **Step 1: Update `vite.config.ts`** ✅
- [ ] **Step 2: Add paths to `tsconfig.app.json`** ✅
- [ ] **Step 3: Verify** ✅ `npm run build` passes

---

### Task 2: Types + API client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/tickets.api.ts`
- Create: `frontend/src/api/users.api.ts`
- Create: `frontend/src/lib/status-transitions.ts`

- [ ] **Step 1: Create types** — as in design doc (`Priority`, `TicketStatus`, `User`, `UserSummary`, `Ticket`, `Comment`, `ApiSuccess`, `CreateTicketInput`, `UpdateTicketInput`, `ApiClientError` class).

- [ ] **Step 2: Create `fetchJson`**

```ts
export async function fetchJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    })
  } catch {
    throw new ApiClientError('NETWORK_ERROR', 'Unable to reach the server. Check that the API is running.', 0)
  }

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string } } | null
    throw new ApiClientError(
      err?.error?.code ?? 'UNKNOWN_ERROR',
      err?.error?.message ?? `Request failed (${res.status})`,
      res.status
    )
  }

  const success = body as { data: T }
  return success.data
}
```

- [ ] **Step 3: Ticket + user API wrappers** including `listComments(ticketId)` and `addComment`.

- [ ] **Step 4: `status-transitions.ts`** with `VALID_TRANSITIONS` + `getNextStatuses(status)`.

---

### Task 3: Hooks

**Files:**
- Create: `frontend/src/hooks/useMutation.ts`
- Create: `frontend/src/hooks/useUsers.ts`
- Create: `frontend/src/hooks/useTickets.ts`
- Create: `frontend/src/hooks/useTicketDetail.ts`

- [ ] **Step 1: `useMutation`** — generic mutate/loading/error/reset; catch `ApiClientError`.

- [ ] **Step 2: `useUsers`** — fetch once on mount.

- [ ] **Step 3: `useTickets`** — search + status state; refetch when they change (debounce search ~300ms optional; simple is fine).

- [ ] **Step 4: `useTicketDetail`** — `Promise.all([getTicket, listComments])`; expose `{ ticket, comments, loading, error, refetch }`.

---

### Task 4: Shared components

**Files:**
- Create: `frontend/src/components/ErrorMessage.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`
- Create: `frontend/src/components/UserSelect.tsx`
- Create: `frontend/src/components/TicketCard.tsx`
- Create: `frontend/src/components/StatusControl.tsx`
- Create: `frontend/src/components/CommentThread.tsx`

- [ ] **Step 1: ErrorMessage, StatusBadge, UserSelect**

- [ ] **Step 2: TicketCard** — compact row + `Link`

- [ ] **Step 3: StatusControl** — buttons from `getNextStatuses`

- [ ] **Step 4: CommentThread** — list + form (message + UserSelect + submit via callback)

---

### Task 5: Pages + routing + styles

**Files:**
- Create: `frontend/src/pages/TicketListPage.tsx`
- Create: `frontend/src/pages/CreateTicketPage.tsx`
- Create: `frontend/src/pages/TicketDetailPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css`
- Delete or stop importing: starter `App.css` / hero assets from App

- [ ] **Step 1: TicketListPage** — search, status filter, New ticket link, rows

- [ ] **Step 2: CreateTicketPage** — form with createdBy UserSelect; navigate to `/tickets/:id` on success

- [ ] **Step 3: TicketDetailPage** — split layout; edit + save; StatusControl; CommentThread

- [ ] **Step 4: Wire Router** in `main.tsx` / `App.tsx`

- [ ] **Step 5: Theme CSS** — variables for status colours, layout, compact rows, split detail responsive

---

### Task 6: Verify + artifacts

**Files:**
- Modify: `tool-specific/cursor-workflow/tasks.md`
- Modify: `docs/superpowers/specs/2026-07-13-phase-3-frontend-design.md` (status → Approved)

- [ ] **Step 1: `cd frontend && npm run build`** — must pass

- [ ] **Step 2: Manual smoke** (if backend up): list / create / detail / status / comment

- [ ] **Step 3: Mark Phase 3.2–3.6 tasks complete** in `tasks.md` (leave PR checkbox until PR opened)

- [ ] **Step 4: Report done** — ask user whether to open Phase 3 PR

---

## Self-review

1. **Spec coverage:** List, create, detail edit, status, comments, search/filter, errors — all tasked.  
2. **Comments gap:** Explicit parallel fetch (backend does not embed comments on ticket GET).  
3. **No placeholders** in steps above.
