# Requirement Analysis

> **Assessment artifact** — AI-assisted analysis of the TMS requirements. Update this during Phase 0 before writing any code.

---

## Gaps and Ambiguities Identified

> Use AI to surface these. Prompt: "What could go wrong with this requirement, and what's missing?"
> Document your analysis below.

### Gap 1: User context (no auth)

**Ambiguity:** Without authentication, how does the system know who is creating or commenting on a ticket?  
**Decision:** Use a hardcoded or dropdown-selected seeded user on the frontend (assessment explicitly de-scopes auth from Core). The `createdBy` field is populated from the selected user.  
**Risk:** This is a known simplification; the data model supports auth being added later.

### Gap 2: State machine — what happens on invalid transitions?

**Ambiguity:** The brief says "Invalid transitions must be rejected" but does not specify the exact error shape.  
**Decision:** HTTP 422 with `{ error: { code: "INVALID_TRANSITION", message: "Cannot transition from X to Y" } }`. This follows the standard API envelope defined in `CONVENTIONS.md`.

### Gap 3: Search scope

**Ambiguity:** "Keyword search" does not specify which fields.  
**Decision:** Search on `title` and `description` (case-insensitive, partial match via `ILIKE` in Postgres). This is the most useful scope for support tickets.

### Gap 4: Priority — are all tickets required to have one at creation?

**Ambiguity:** Brief lists priority as a field but doesn't explicitly mark it as required for creation.  
**Decision:** `priority` is required at creation time. A ticket without a priority is not useful in a real support system.

### Gap 5: Comment author

**Ambiguity:** Same as Gap 1 — no auth means comment author is unknown.  
**Decision:** `createdBy` for comments uses the same selected/seeded user approach as ticket creation.

---

## Derived Acceptance Criteria

See `tool-specific/cursor-workflow/acceptance-criteria.md` for the full set derived from this analysis.

---

## Edge Cases to Handle

| Scenario | Handling |
|----------|---------|
| Ticket not found (invalid ID) | 404 with `{ error: { code: "NOT_FOUND" } }` |
| Assignee user ID does not exist | 400 with validation error |
| Empty search string | Return all tickets (same as no search param) |
| Status filter with invalid value | 400 with validation error |
| Adding comment to non-existent ticket | 404 |
| Transitioning a CLOSED ticket | 422 INVALID_TRANSITION |
| Transitioning a CANCELLED ticket | 422 INVALID_TRANSITION |

---

## Requirement Clarity Score (self-assessment)

| Requirement | Clear? | Notes |
|-------------|--------|-------|
| Entity schema | ✅ Clear | Minor decisions on optionality |
| State machine | ✅ Clear | Explicit transition table in brief |
| Search/filter | ⚠️ Partial | Search fields not specified; decided above |
| Auth | ✅ Clear | Explicitly de-scoped from Core |
| Tests | ✅ Clear | Integration tests for state machine explicitly required |
| Seed data | ✅ Clear | Required, specifics left to implementation |
