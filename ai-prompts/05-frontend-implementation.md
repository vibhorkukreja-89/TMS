# Activity: Frontend Implementation

Turning the approved design into code, then tightening it in response to review.

---

## Prompt 26 — Implement the frontend foundation

**Prompt:** Proceed with the implementation.

**AI response summary:** Wrote the Phase 3 plan and implemented the frontend foundation: types, typed API client, hooks (`useTickets`, `useTicketDetail`, `useUsers`, `useMutation`), components (`TicketCard`, `StatusBadge`, `StatusControl`, `CommentThread`, `ErrorMessage`, `UserSelect`), pages, routing, and styles. `npm run build` and lint passed.

**Accepted:** The full foundation, matching the approved design.
**Changed:** Discovered immediately after that the ticket list threw a 500 — a backend bug, not a frontend one (see `06-debugging.md`, Prompt 27).
**Rejected:** —.
**Why:** Because the design was pre-approved section by section, implementation was mostly mechanical and built clean on the first pass.

---

## Prompt 29 — Apply first-round review fixes

**Prompt:** Yes, apply the suggestions.

**AI response summary:** Applied the review fixes: enabled strict TypeScript on the frontend, cleared the comment draft **only on success**, narrowed the route `id`, added a request-race guard, set `Content-Type` only when there's a body, typed the response envelope, and removed leftover Vite scaffold assets. Build/lint passed.

**Accepted:** All fixes.
**Changed:** Comment-draft handling (clear-on-success, not clear-always) and Content-Type logic.
**Rejected:** —.
**Why:** Several of these were genuine acceptance-criteria concerns (readable error UX, strict typing), not cosmetics — see `code-review-notes.md`.

---

## Prompt 32 — Apply PR #4 review fixes

**Prompt:** It looks good, apply those fixes and push to the PR.

**AI response summary:** Applied PR #4 review fixes: display `updatedAt` on the detail view (AC-3), a detail request-race guard, list dimming during refetch, clearer status labels, removed an unused `icons.svg`; clarified the Jest-dependency lockfile churn in the PR body; pushed.

**Accepted:** All fixes.
**Changed:** Detail view now satisfies AC-3 (`updatedAt` shown).
**Rejected:** —.
**Why:** Fixing an actual acceptance-criteria gap (`updatedAt`) found in review, plus explaining lockfile churn in the PR body for reviewer clarity.
