# TMS — Hard Constraints

These constraints are non-negotiable. They are enforced by Cursor rules and must never be violated in any session. If the AI suggests something that contradicts these, reject it.

---

## Security

**R-SEC-1: No secrets in code.**  
API keys, database URLs, passwords, tokens, and private keys must live only in `.env` (gitignored). `.env.example` with placeholder values is committed. No secret ever appears in source code, tests, logs, or documentation.

**R-SEC-2: No real data in seed files.**  
`prisma/seed.ts` uses synthetic, fictional data only. No real names, emails, or any PII.

**R-SEC-3: No sensitive data in logs.**  
Logger must never output passwords, tokens, session IDs, or PII — even in development.

---

## Architecture

**R-ARCH-1: Database access only through repositories.**  
No Prisma client import outside `backend/src/repositories/`. Services call repositories; routes call services. Violating this breaks the separation of concerns the architecture depends on.

**R-ARCH-2: Standard API envelope everywhere.**  
All API responses use `{ data }` or `{ error: { code, message } }`. No bare responses, no different shapes for different routes.

**R-ARCH-3: No new dependency without justification.**  
Every new package added must have a comment in the relevant `package.json` PR explaining why it was added and why existing packages couldn't satisfy the need.

---

## Business Logic

**R-BIZ-1: State machine enforced in the backend only.**  
`TicketService.changeStatus()` is the single source of truth for valid transitions. The frontend may mirror the logic for UX purposes but must never trust its own enforcement. The backend always re-checks.

**R-BIZ-2: Invalid transitions return HTTP 422 with a structured error.**  
The error must be:
```json
{ "error": { "code": "INVALID_TRANSITION", "message": "Cannot transition from Open to Closed" } }
```
Never a generic 500 for a business rule violation.

**R-BIZ-3: Required fields are validated before any DB write.**  
Ticket creation requires at minimum: `title` (non-empty string), `priority` (valid enum value), `createdBy` (valid user id). Backend rejects with 400 if any are missing or malformed.

---

## Testing

**R-TEST-1: State machine integration tests are mandatory.**  
The project is not complete until `backend/src/__tests__/ticket-status.test.ts` exists and all tests pass. This is the core assessment criterion.

**R-TEST-2: Never delete or skip tests to make the suite pass.**  
If a test fails, fix the code (or fix the test if it was wrong). Skipping tests with `xit` or `test.skip` to unblock a merge is not acceptable.

**R-TEST-3: Test database isolation.**  
Tests use a separate database or transaction rollback. They must never mutate the development database.

---

## Artifacts

**R-ART-1: Prompt history is auto-maintained — never manually edited.**  
`prompt-history/` files are written by the `prompt-recorder` Cursor rule after every session. Do not edit them by hand.

**R-ART-2: Lifecycle artifacts are updated during work, not after.**  
`docs/design-decisions.md` is updated when a decision is made. `docs/debugging-log.md` is updated when a bug is investigated. An empty `docs/` at submission time is a red flag in the assessment.

**R-ART-3: Every PR uses the standard PR description template.**  
See `tms-artifacts` Cursor rule for the template. No PRs without What / Why / Test evidence / AI usage sections.
