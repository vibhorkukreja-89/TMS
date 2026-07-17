# Activity: Integration, Polish & Operational Care

End-to-end verification and error-path polish — plus two prompts that show responsible handling of long-running/kill-able dev processes.

---

## Prompt 33 — Phase 4 end-to-end verification

**Prompt:** Proceed with Phase 4 — Integration and Polish.

**AI response summary:** Ran the full API end-to-end plus restart-persistence checks (all passing): create → list → detail → update → status change → comment → search + combined filter; empty title/comment → 400; invalid transition → 422; data survives a backend restart; frontend `npm run build` succeeds; `npm test` 15/15. Polished `fetchJson` to surface Zod `details` field messages instead of the generic "Validation failed" (DD-20). Documented the evidence and opened the Phase 4 PR.

**Accepted:** The E2E verification and the `fetchJson` details-surfacing polish.
**Changed:** Error messages now show per-field detail (e.g. `title: Title is required`).
**Rejected:** —.
**Why:** This is the explicit validation step — behaviour proven against running servers and recorded as evidence (`docs/debugging-log.md`, Phase 4), not just assumed. Also a testing/validation-focused prompt, which strong prompt histories should include.

---

## Prompts 34 & 35 — Operational care with running services

**Prompts:** P34 and P35 (system) — report the task result and do any needed follow-up.

**AI response summary:** The persistence-restart shell task was aborted/terminated and left the backend on `:3000` down. The assistant reported this clearly and restarted `npm run dev` (P34) / explained how to start it (P35), rather than silently leaving the API dead or force-killing other processes.

**Accepted:** Restarting the backend and informing the user of the port state.
**Changed:** —.
**Rejected:** Casually killing/restarting services without regard for an active terminal — handled deliberately.
**Why:** Shows responsible judgment around destructive/operational actions on the user's machine — it kept the dev environment usable and was transparent about state.
