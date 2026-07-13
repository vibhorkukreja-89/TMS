# AI Tool Workflow

## 1. Primary AI tool used

My primary tool is **Cursor IDE**, running on Claude Sonnet.

I chose it over browser-based tools like ChatGPT or standalone assistants because the context problem is already half-solved, it lives inside the editor, sees my open files, understands my repo structure, and can take multi-step actions without me copy-pasting code back and forth. The agent mode is particularly useful: I can describe what I want done and let it work through the problem, stepping in when it needs a decision rather than hand-holding every line.

That said, the tool is a means, not the method. The workflow matters more than which model is underneath it.

---

## 2. How you provide project context to the tool

AI is only as useful as the context you give it. If you drop it into a codebase cold, you'll get generic, often wrong output.

My approach is layered:

- **At the repo level**, rather than a single monolithic `AGENTS.md`, I split the project context across dedicated files so each concern stays focused and easy to maintain. Every new team member and every AI session starts by reading these:

  | File | Purpose |
  |---|---|
  | `PROJECT.md` | Stack (languages, frameworks, runtime versions, infrastructure) and folder layout, module boundaries, what lives where and why |
  | `CONVENTIONS.md` | Coding style, naming rules, import ordering, error handling patterns, and any patterns explicitly banned in this codebase |
  | `RULES.md` | Hard constraints the agent must never violate (e.g. "never add a dependency without justification", "all API responses use the standard envelope shape", "no direct database calls outside the repository layer") |

  A `.cursorrules` file at the root ties these together, pointing the agent to each file so the full context loads automatically at the start of every session.

- **At the session level**, I use `@`-mentions to pull in the specific files or modules relevant to the task. If I'm working on the auth service, I'm not flooding the context with unrelated UI components.
- **For greenfield work**, I write a short spec or README before I touch code. Even a rough one. It gives the agent something concrete to reason against instead of making assumptions I'll have to undo later.

The principle: AI should understand your project, not guess at it.

---

## 3. How you use AI for requirement analysis

Raw requirements, whether they come from a ticket, a Slack message, or a 30-minute stakeholder call, are almost always incomplete. AI is genuinely useful here, but not as a summariser. I use it as a sceptical colleague.

I paste the raw requirement and ask it to:
- Surface ambiguities and unstated assumptions
- Identify missing edge cases
- Flag conflicts with existing system behaviour
- Ask the uncomfortable questions a stakeholder might not have considered

The prompt that works best isn't "summarise this", it's **"what could go wrong with this requirement, and what's missing?"** That framing changes the output entirely.

Once the gaps are identified, I use AI to rewrite the requirement into a clean spec with explicit acceptance criteria. That spec is what goes into the ticket and what engineers build against.

---

## 4. How you use AI for planning and design

With a solid spec, I move into design using Cursor's Plan mode. I give it the spec and ask it to:

- Produce a step-by-step implementation plan
- Propose a data model
- Suggest component and service boundaries
- Call out trade-offs (e.g. "synchronous vs event-driven here, what breaks at scale?")

I never accept the first plan as-is. I push on it with pointed questions: *"What's the simplest version of this?"* or *"What does this look like in six months when traffic doubles?"* The AI is good at exploring the solution space quickly; the judgment call on what to actually build is still mine.

The output I care most about is a task breakdown that maps directly to PRs or tickets, concrete, actionable work items, not just a design diagram that lives in a doc no one reads.

---

## 5. How you use AI for code generation

I work in small, controlled chunks. One logical unit at a time, a function, a service layer, a route handler, reviewed before moving on.

Before generating anything, I give the agent tight constraints:
- The exact function signature I expect
- Existing patterns in the codebase to follow
- What *not* to do (e.g. "don't add a new library, use what's already here")

For boilerplate-heavy work, CRUD operations, schema definitions, repetitive config, I let it run wider. For anything touching auth, payments, or core business logic, I stay narrow and verify every step before moving to the next.

The agent works from the context of my open files, so it generally matches existing style. If it doesn't, that's a signal I need to improve my context setup, not that I should accept inconsistent code.

---

## 6. How you validate AI-generated code

I never rubber-stamp generated code. No matter how confident the output looks, my validation checklist is:

1. **Read it line by line.** Does the logic actually match the requirement, or just *look* right at a glance?
2. **Check for hallucinated references.** Methods, libraries, or interfaces that don't exist in the project, it happens more than you'd expect.
3. **Verify edge cases.** Nulls, empty arrays, unauthenticated requests, network failures, things the agent quietly skipped.
4. **Run the linter and type checker immediately.** If it introduces warnings, I fix them before moving on. Technical debt starts here.
5. **Trace both paths.** For anything touching data or external calls, I walk through the happy path *and* the failure path manually.
6. **Ask the agent to self-audit.** "What assumptions did you make here? What could break?" It often surfaces its own blind spots when asked directly.
7. **Check the unit tests.** Generated code should come with meaningful tests, not just tests that were easy to write. I actively prune test cases that cover trivially obvious behaviour (a getter returning a value, a constructor setting a field), those add noise and false confidence without real coverage value. Quality over quantity, always.

---

## 7. How you use AI for testing

I use AI in two directions for testing.

**Forward:** After writing a function, I ask Cursor to generate unit tests, but I give it the edge cases I already have in mind and ask it to find ones I *haven't* thought of. The goal is for it to surprise me, not just confirm what I already know.

**Backward:** I paste an existing module and ask "what scenarios are not covered by these tests?" This is one of the most underused prompts in a testing workflow and regularly surfaces meaningful gaps.

For integration and E2E tests, I use AI to generate scaffolding and test data fixtures. The assertions I write myself, those require domain knowledge the agent doesn't have, and getting them wrong gives false confidence.

I also ask it to flag tests that are testing implementation detail rather than observable behaviour. Those are the tests that shatter on refactors and add zero real value.

---

## 8. How you use AI for debugging

When something breaks, I don't start with "fix this." That's the fastest way to get a confident-sounding wrong answer.

My process:

1. **Give it full context first.** The error message, the stack trace, the relevant code, and critically: what I expected to happen vs. what actually happened. The delta between expectation and reality is where the bug lives.
2. **Ask it to explain before it suggests.** "What does this error mean and trace the execution path step by step." This forces reasoning, not pattern-matching to a superficially similar problem it's seen before.
3. **Generate a hypothesis list.** "What are the three most likely causes of this?" Then I verify each one myself before touching anything.
4. **Rubber-duck the logic.** For subtle bugs, I ask: "Walk me through what this function does on this specific input." Half the time, that alone surfaces the issue, same as explaining a bug to a colleague.
5. **Never apply a fix I don't understand.** If I can't explain why the suggested fix works, I don't use it until I can.

---

## 9. How you use AI for code review

Two modes, different goals.

**Self-review before a PR:** I paste the diff and ask Cursor to critique it as a senior engineer would, looking for logic errors, security issues, missing error handling, performance concerns, and violations of project conventions. I treat it like a pre-flight checklist, not an authority. I decide what's worth acting on.

**Reviewing others' code:** I use AI to quickly understand unfamiliar code, "explain what this change does and what could break", so I can focus my human attention on intent and design decisions rather than syntax. I explicitly ask it to flag security smells and missing edge cases. But the final call is always mine. AI surfaces issues; humans make the judgement.

The rule I hold to: AI review is a first pass, not a replacement for thinking.

---

## 10. What information you avoid sharing unnecessarily with AI tools

This one matters and I take it seriously.

**Hard stops, never under any circumstances:**
- Secrets, API keys, tokens, passwords, private keys
- Real customer data, PII, transaction records. I use anonymised or synthetic data instead.
- Internal infrastructure details that could be a liability if exposed (internal service URLs, network topology, IP ranges)
- Proprietary business logic that represents a genuine competitive advantage. I abstract the *pattern* of the problem without revealing the specific domain logic.

**Practical principle:** Share the *shape* of the problem, not the sensitive substance of it. A trimmed schema with relevant tables is almost always enough, pasting the entire production database schema isn't necessary and isn't worth the risk.

If I'm unsure whether something should be shared, the answer is no until I've thought it through.

---

## 11. How you would reuse this workflow in a real project

A workflow that only exists in one person's head isn't a workflow, it's a habit that disappears when that person moves teams.

Here's how I operationalise it:

- **`PROJECT.md`, `CONVENTIONS.md`, `RULES.md` in the repo root**: the context files from Section 2. Checked in, versioned, and treated like any other engineering standard. Any engineer or AI session working on this project reads these first.
- **`.cursorrules`**: ties the context files together and enforces code style and conventions automatically across every AI session on the project.
- **This document (`tool-workflow.md`)**: lives in the repo so any engineer can pick it up and follow it. It's not a one-time deliverable; it gets updated as the tools evolve and as the team learns what actually works.
- **Built into the PR process**: an AI self-review pass before human review is required, not optional. It becomes part of the definition of "ready for review."
- **Day-one onboarding reading**: new engineers read this on their first day so they're not improvising their own AI habits and introducing inconsistency.
- **Quarterly review**: tools move fast. What was best practice six months ago may be outdated. We revisit and update the workflow together as a team.

The goal is that this workflow outlives any individual contributor. It belongs to the team.

---
