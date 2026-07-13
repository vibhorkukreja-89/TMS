# TMS — Acceptance Criteria

> **Assessment artifact** — complete acceptance criteria for all Core requirements.

---

## Core Acceptance Criteria

### AC-1: Create Ticket

**Given** the user is on the create ticket page  
**When** they submit a form with a valid title and priority  
**Then** a new ticket is created with status `OPEN`, persisted to the database, and the user is redirected to the ticket detail view

**Given** the user submits a form with an empty title  
**Then** the backend returns HTTP 400 with a validation error, and the UI displays a meaningful error message (not a raw JSON dump)

---

### AC-2: List Tickets

**Given** tickets exist in the database  
**When** the user views the ticket list page  
**Then** all tickets are displayed with their title, priority, status, and assignee

**Given** the server is restarted  
**When** the user views the ticket list  
**Then** all previously created tickets are still present (data persists)

---

### AC-3: View Ticket Detail

**Given** a ticket exists  
**When** the user opens the ticket detail view  
**Then** all ticket fields (title, description, priority, status, assignee, timestamps) are displayed, along with any associated comments

---

### AC-4: Update Ticket Fields

**Given** the user is on the ticket detail view  
**When** they edit the title, description, priority, or assignee and save  
**Then** the changes are persisted to the database and the updated values are reflected in the UI

---

### AC-5: Change Ticket Status (state machine)

**Given** a ticket in status `OPEN`  
**When** the user selects `IN_PROGRESS` as the next status  
**Then** the ticket status is updated to `IN_PROGRESS` and the change is reflected in the UI

**Given** a ticket in status `OPEN`  
**When** the status control is rendered  
**Then** only `IN_PROGRESS` and `CANCELLED` are offered as valid next states — `RESOLVED`, `CLOSED` are not shown

**Given** a ticket in status `OPEN`  
**When** a PATCH request is sent to `/api/tickets/:id/status` with `status: "CLOSED"`  
**Then** the backend returns HTTP 422 with `{ "error": { "code": "INVALID_TRANSITION", "message": "..." } }`

**Given** a ticket in status `CLOSED`  
**When** any status change is attempted  
**Then** the backend rejects it with HTTP 422 (terminal state — no exit)

**Given** a ticket in status `CANCELLED`  
**When** any status change is attempted  
**Then** the backend rejects it with HTTP 422 (terminal state — no exit)

---

### AC-6: Add Comments

**Given** a ticket exists  
**When** the user submits a non-empty comment  
**Then** the comment is persisted and displayed in the ticket's comment thread

**Given** the user submits an empty comment  
**Then** the backend returns HTTP 400 and the UI shows a validation error

---

### AC-7: Search and Filter

**Given** tickets with titles "Login bug" and "Payment issue" exist  
**When** the user searches for "login"  
**Then** only "Login bug" is shown in the results (case-insensitive partial match on title and description)

**Given** tickets with statuses OPEN, IN_PROGRESS, and RESOLVED exist  
**When** the user filters by status "OPEN"  
**Then** only tickets with status OPEN are shown

**Given** both a search term and status filter are active  
**Then** results are filtered by both simultaneously

---

### AC-8: Data Persistence

**Given** tickets and comments exist  
**When** the backend server is stopped and restarted  
**Then** all data is still present and accessible via the API

---

### AC-9: Input Validation

**Given** any POST or PATCH request to the API  
**When** required fields are missing or malformed  
**Then** the response is HTTP 400 with `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }` — never a 500

---

### AC-10: Error States in UI

**Given** the backend returns any error (400, 404, 422, 500)  
**Then** the UI displays a user-readable error message — not raw JSON, not a blank screen, not a JavaScript exception

**Given** the network is unavailable  
**Then** the UI displays an appropriate connection error (not a crash)

---

### AC-11: State Machine Integration Tests

**Given** the test suite is run with `npm test`  
**Then** all of the following pass:
- Open → In Progress: HTTP 200 ✓
- In Progress → Resolved: HTTP 200 ✓
- Resolved → Closed: HTTP 200 ✓
- Open → Cancelled: HTTP 200 ✓
- In Progress → Cancelled: HTTP 200 ✓
- Open → Resolved: HTTP 422 ✗
- Open → Closed: HTTP 422 ✗
- In Progress → Open: HTTP 422 ✗
- Resolved → In Progress: HTTP 422 ✗
- Closed → (any): HTTP 422 ✗
- Cancelled → (any): HTTP 422 ✗

---

### AC-12: Security

**Given** the repository is cloned  
**Then** no `.env` file exists (it is gitignored)  
**Then** no secrets, API keys, passwords, or PII exist in any committed file  
**Then** `.env.example` exists with placeholder values

---

## Definition of Done (Core)

The Core submission is complete when:
- [ ] All 12 acceptance criteria above are verifiable
- [ ] `README.md` allows a clean-clone setup without additional instructions
- [ ] State machine integration tests all pass
- [ ] `prompt-history/` contains the actual prompt log
- [ ] `docs/` contains all four artifact files with real content
- [ ] No secrets are committed
