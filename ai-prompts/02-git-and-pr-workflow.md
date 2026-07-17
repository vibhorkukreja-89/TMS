# Activity: Git & PR Workflow

The per-phase PR cadence is a required artifact. These prompts show driving Git/PR automation through the GitKraken MCP and `gh` CLI — including a stretch of **auth friction** that had to be worked through honestly rather than faked.

---

## Prompts 8, 9, 10 — PR-tooling auth friction (iteration)

**Prompts (sequence):**
- P8: "Option A — Authenticate GitKraken done, proceed to create the PR"
- P9: "Retry PR creation with Authenticate GitKraken"
- P10: "try again for the PR, auth done for gh."

**AI response summary:** Across three attempts the GitKraken MCP kept returning an unauthenticated error despite claimed auth; `mcp_auth` reported success but PR creation still failed (no `GITHUB_TOKEN`). Installed `gh` via Homebrew, but `gh auth status` showed no login and `~/.config/gh/` didn't exist. The assistant stopped retrying blindly and gave a concrete unblock: run `gh auth login --web` interactively until "Logged in as" is confirmed, or open the PR via the GitHub compare URL, and it provided the full PR description for manual creation.

**Accepted:** The interactive `gh auth login` guidance and the ready-to-paste PR description.
**Changed:** Switched the intended tool from the GitKraken MCP to the `gh` CLI once the MCP proved unreliable.
**Rejected:** Repeatedly re-calling `mcp_auth` after it clearly wasn't fixing the failure — the assistant correctly diagnosed the real state (`no login`) instead of looping.
**Why:** Good example of *not* trusting a tool's "success" message when downstream calls keep failing, and of giving the user a real, verifiable unblock.

---

## Prompt 11 — PR finally created

**Prompt:** Just completed the auth again with gh, try now.

**AI response summary:** Verified `gh` auth as `vibhorkukreja-89`, created **PR #1**, marked the final Phase 0 checkbox `[x]`, committed and pushed to `boilerplate`. Phase 0 complete.

**Accepted:** PR creation + checkbox update.
**Why:** Only proceeded once auth was actually verified, not merely claimed.

---

## Prompt 13 — Phase 1 PR

**Prompt:** (system: continue — open Phase 1 PR)

**AI response summary:** Opened **PR #2** for Backend Foundation; marked the final Phase 1 checkbox and committed.

**Accepted:** As-is.
**Why:** Kept the phase-gate discipline (PR per phase) intact.

---

## Prompts 30 & 37 — Later phase PRs

**Prompts:** P30 "Yes, commit the changes and open the PR" (Phase 3); P37 "proceed" (Phase 5).

**AI response summary:** P30 committed the Phase 3 frontend + validate fix and opened **PR #4**, ticking the Phase 3 PR checkbox. P37 completed the Phase 5 README + reflection, verified 15/15 tests and no tracked `.env`, and opened the final **PR #6**.

**Accepted:** Both PRs and the checkbox/tasks updates.
**Changed:** —.
**Rejected:** —.
**Why:** Each PR followed the What/Why/Test-evidence/AI-usage template, giving spec-to-implementation traceability (the whole point of the cadence).
