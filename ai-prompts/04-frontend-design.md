# Activity: Frontend Design (Iterative)

Rather than accept the AI's first UI, design was driven as a series of explicit choices — each prompt locks one decision and moves to the next. This is the clearest example of **iteration and human-in-the-loop design** in the project.

---

## Prompt 17 — Enter design mode

**Prompt:** Proceed with Phase 3 — Frontend Foundation.

**AI response summary:** Explored Phase 3 context (scaffold done; types/API/pages/hooks pending), started brainstorming, and offered a live visual companion before jumping to code.

**Accepted:** The brainstorm-first approach.
**Why:** Design decisions were made deliberately before scaffolding, not reverse-engineered from generated code.

---

## Prompts 18–19 — Ticket list layout

**Prompts:** P18 "yes, let me check the design"; P19 "Compact rows".

**AI response summary:** Presented three list layouts (dense table, card grid, compact rows) in a visual companion; user chose **compact rows**.

**Accepted:** Compact rows (DD-16).
**Rejected:** Dense table (markup complexity) and big-card grid (too sparse).
**Why:** Being shown concrete options and choosing one produced a defensible design decision rather than an arbitrary default.

---

## Prompt 20 — Current-user model

**Prompt:** Proceed with C.

**AI response summary:** Locked **per-form user dropdowns** for `createdBy` (rather than a global "acting as" session), then presented detail-layout options.

**Accepted:** Per-form `UserSelect` (DD-17).
**Rejected:** A global header session user — it would imply a fake login.
**Why:** Keeps authorship explicit without pretending to have auth the spec de-scoped.

---

## Prompts 22–23 — Detail layout & data architecture

**Prompts:** P22 "Proceed with B — Split detail"; P23 "Proceed with 1. Custom hooks + typed fetch (recommended)".

**AI response summary:** Locked the **split detail layout** (main column + status side panel, DD-18) and the **custom-hooks + typed-fetch** data architecture (DD-15) over the alternatives.

**Accepted:** Split layout; custom hooks + typed fetch.
**Rejected:** Single-column detail; and (implicitly) React Query — kept dependencies minimal.
**Why:** Isolating the status control in a side panel makes the state machine visible; custom hooks give clear layering without a cache library.

---

## Prompts 24–25 — Approve the design doc section by section

**Prompts:** P24 "Yes, the above looks correct. Proceed."; P25 "yes, proceed with the design doc".

**AI response summary:** Reviewed Design Section 1 (architecture, folder layout, data flow, Vite proxy) and Section 2 (components, status-machine UX, error handling, pages) before committing the Phase 3 design spec plus DD-15–DD-18.

**Accepted:** Both sections, after review.
**Changed:** —.
**Rejected:** —.
**Why:** Approving the design *in sections* before any implementation meant the later build had almost no rework — the design doc was the contract.
