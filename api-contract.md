# API Contract

Base URL (dev): `http://localhost:3000` · All routes under `/api`. The Vite dev server proxies `/api/*` to this origin.

## Conventions

**Response envelope** — every response (except `/health`) uses one of:

```jsonc
// success
{ "data": <T>, "meta"?: { "total": <number> } }

// error
{ "error": { "code": "<STRING>", "message": "<STRING>", "details"?: { "<field>": ["<msg>"] } } }
```

**Status codes:** `200` OK · `201` Created · `400` validation failure · `404` not found · `422` business-rule / invalid state transition · `500` unexpected.

**Error codes:** `VALIDATION_ERROR` (400) · `NOT_FOUND` (404) · `INVALID_TRANSITION` (422) · `INTERNAL_ERROR` (500) · `NETWORK_ERROR` (client-side, when the API is unreachable).

**Auth:** none (de-scoped). Identity is passed explicitly as `createdById` in request bodies.

**IDs:** opaque `cuid()` strings.

---

## Endpoint: List tickets · Method: `GET` · Path: `/api/tickets` · Purpose: list with optional keyword search + status filter

### Request
Query params (all optional): `search` (string — case-insensitive partial match on title + description), `status` (`OPEN|IN_PROGRESS|RESOLVED|CLOSED|CANCELLED`). Both combinable. No body.

```
GET /api/tickets?search=login&status=IN_PROGRESS
```

### Response — `200`
```jsonc
{
  "data": [
    {
      "id": "clx...", "title": "Login fails", "description": "…", "priority": "HIGH",
      "status": "IN_PROGRESS", "createdById": "clu1", "assignedToId": "clu2",
      "createdAt": "2026-07-13T10:00:00.000Z", "updatedAt": "2026-07-13T11:00:00.000Z",
      "createdBy":  { "id": "clu1", "name": "Alice", "email": "alice@example.com" },
      "assignedTo": { "id": "clu2", "name": "Bob",   "email": "bob@example.com" }
    }
  ],
  "meta": { "total": 1 }
}
```

### Validation Rules
`ticketQuerySchema`: `search` optional string; `status` optional enum. Unknown query keys are ignored; an invalid `status` value → 400.

### Error Responses
`400 VALIDATION_ERROR` (invalid `status` value) · `500 INTERNAL_ERROR`.

---

## Endpoint: Create ticket · Method: `POST` · Path: `/api/tickets` · Purpose: create a ticket (starts `OPEN`)

### Request
```jsonc
{
  "title": "Payment page 500s",       // required, 1–255 chars
  "description": "Stack trace attached", // optional
  "priority": "CRITICAL",              // required enum
  "createdById": "clu1",               // required
  "assignedToId": "clu2"               // optional
}
```

### Response — `201`
```jsonc
{ "data": { "id": "clx...", "title": "Payment page 500s", "status": "OPEN", "priority": "CRITICAL",
            "createdById": "clu1", "assignedToId": "clu2", "createdAt": "…", "updatedAt": "…",
            "createdBy": { … }, "assignedTo": { … } } }
```

### Validation Rules
`createTicketSchema`: `title` string min 1 ("Title is required") max 255; `priority` ∈ enum; `createdById` non-empty; `description`/`assignedToId` optional. `status` is **not** accepted here — new tickets are always `OPEN`.

### Error Responses
`400 VALIDATION_ERROR` (with `details`, e.g. `{ "title": ["Title is required"] }`) · `400` for a non-existent `createdById`/`assignedToId` (FK) · `500`.

---

## Endpoint: Get ticket detail · Method: `GET` · Path: `/api/tickets/:id` · Purpose: fetch a single ticket with user relations

### Request
No body. `:id` is the ticket id. (Comments are fetched via the comments endpoint below.)

### Response — `200`
```jsonc
{ "data": { "id": "clx...", "title": "…", "description": "…", "priority": "HIGH", "status": "OPEN",
            "createdById": "clu1", "assignedToId": null, "createdAt": "…", "updatedAt": "…",
            "createdBy": { "id": "clu1", "name": "Alice", "email": "alice@example.com" },
            "assignedTo": null } }
```

### Validation Rules
None on input beyond a well-formed path.

### Error Responses
`404 NOT_FOUND` (no ticket with that id) · `500`.

---

## Endpoint: Update ticket fields · Method: `PATCH` · Path: `/api/tickets/:id` · Purpose: edit title/description/priority/assignee (not status)

### Request
At least one field required. `description` and `assignedToId` are nullable (send `null` to clear).
```jsonc
{ "title": "New title", "description": null, "priority": "LOW", "assignedToId": "clu3" }
```

### Response — `200`
```jsonc
{ "data": { "id": "clx...", "title": "New title", "priority": "LOW", "assignedToId": "clu3", …, "createdBy": { … }, "assignedTo": { … } } }
```

### Validation Rules
`updateTicketSchema`: all fields optional but the object is refined so **≥1 field must be present** ("At least one field must be provided for update"); `title` 1–255; `priority` enum; `description`/`assignedToId` nullable. `status` is intentionally rejected here — use the status endpoint.

### Error Responses
`400 VALIDATION_ERROR` (empty body / invalid field / bad FK) · `404 NOT_FOUND` · `500`.

---

## Endpoint: Change ticket status · Method: `PATCH` · Path: `/api/tickets/:id/status` · Purpose: move a ticket through the state machine

### Request
```jsonc
{ "status": "IN_PROGRESS" }   // required enum
```

### Response — `200`
```jsonc
{ "data": { "id": "clx...", "status": "IN_PROGRESS", "updatedAt": "…", … } }
```

### Validation Rules
`changeStatusSchema`: `status` ∈ `OPEN|IN_PROGRESS|RESOLVED|CLOSED|CANCELLED`. A value outside the enum fails **before** the state machine (→ 400). A well-formed value that is not a legal next state for the current status is rejected by the service (→ 422).

**Legal transitions:** `OPEN→{IN_PROGRESS,CANCELLED}`, `IN_PROGRESS→{RESOLVED,CANCELLED}`, `RESOLVED→{CLOSED}`, `CLOSED→{}`, `CANCELLED→{}`.

### Error Responses
`400 VALIDATION_ERROR` (status not in enum) · `404 NOT_FOUND` · `422 INVALID_TRANSITION`:
```jsonc
{ "error": { "code": "INVALID_TRANSITION", "message": "Cannot transition from OPEN to CLOSED" } }
```

---

## Endpoint: List comments · Method: `GET` · Path: `/api/tickets/:id/comments` · Purpose: comment thread for a ticket

### Request
No body.

### Response — `200`
```jsonc
{ "data": [ { "id": "cmt1", "ticketId": "clx...", "message": "Looking into it",
              "createdById": "clu2", "createdAt": "…",
              "createdBy": { "id": "clu2", "name": "Bob", "email": "bob@example.com" } } ],
  "meta": { "total": 1 } }
```

### Validation Rules
None on input.

### Error Responses
`404 NOT_FOUND` (ticket missing) · `500`.

---

## Endpoint: Add comment · Method: `POST` · Path: `/api/tickets/:id/comments` · Purpose: append a comment

### Request
```jsonc
{ "message": "Fixed in build 42", "createdById": "clu2" }   // both required, non-empty
```

### Response — `201`
```jsonc
{ "data": { "id": "cmt2", "ticketId": "clx...", "message": "Fixed in build 42",
            "createdById": "clu2", "createdAt": "…", "createdBy": { … } } }
```

### Validation Rules
`createCommentSchema`: `message` min 1 ("Message is required"); `createdById` non-empty.

### Error Responses
`400 VALIDATION_ERROR` (empty message / missing author) · `404 NOT_FOUND` (ticket missing) · `500`.

---

## Endpoint: List users · Method: `GET` · Path: `/api/users` · Purpose: seeded users for assignee/author dropdowns

### Request
No body.

### Response — `200`
```jsonc
{ "data": [ { "id": "clu1", "name": "Alice", "email": "alice@example.com", "role": "ADMIN", "createdAt": "…" } ],
  "meta": { "total": 3 } }
```

### Validation Rules
None.

### Error Responses
`500 INTERNAL_ERROR`.

---

## Endpoint: Health check · Method: `GET` · Path: `/health` · Purpose: liveness probe (outside the envelope)

### Response — `200`
```json
{ "status": "ok" }
```
