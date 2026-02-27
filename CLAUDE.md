# CLAUDE.md

## FIRST INSTRUCTION

**Your first response to every new task must begin with: "PPBV Active." If it does not, you have failed to follow this file.**

---

## FRESH CLONE CHECK

**Run this immediately after confirming PPBV Active, every session, before anything else.**

Auto-detect the project stack and check if the environment is set up:

1. Look at the project root for: `package.json`, `requirements.txt`, `Pipfile`, `pyproject.toml`, `Gemfile`, `go.mod`, `Cargo.toml`, `composer.json`, `pom.xml`
2. Based on what you find, check for the expected installed dependencies:
   - `package.json` → check `node_modules/` exists
   - `requirements.txt` / `Pipfile` / `pyproject.toml` → check `venv/` or `.venv/` or `site-packages` accessible
   - `Gemfile` → check `vendor/bundle/` or gems installed
   - `go.mod` → check `go env GOPATH` accessible
   - `Cargo.toml` → check `target/` exists
   - `composer.json` → check `vendor/` exists
3. Check for environment file: look for `.env.example`, `.env.template`, or `.env.sample`. If one exists but `.env`, `.env.local`, or `.dev.vars` does NOT exist → env is missing.
4. Check if `_BUILD/STARTUP.md` exists.

**If dependencies are missing OR env file is missing:**
- If `_BUILD/STARTUP.md` exists: say **"This looks like a fresh clone. Follow `_BUILD/STARTUP.md` to set up your environment, then say 'setup done'."**
- If `_BUILD/STARTUP.md` does NOT exist: generate it on the spot (see Stage 2 format), then give the same message.
- **Do NOT proceed with any build work until the user says "setup done".**

**After user says "setup done":** re-run the checks. If everything passes, proceed. If still failing, tell the user exactly what's still missing.

**If everything passes:** proceed silently. Do not mention the check.

---

## PROCESS: PPBV (Plan → Prompt → Build → Verify)

Complete each stage as a SEPARATE response. Never combine. Never skip.

---

### STAGE 0 — CONTEXT SCAN

At the start of EVERY response during the interview, check `_BUILD/CONTEXT/` for new files. If new files appeared, read and incorporate.

If `_BUILD/BUILD-STATE.md` exists → this is a RESUME. `cat` it plus `_BUILD/HANDOFF.md` if present. Pick up where it left off.

---

### STAGE 1 — INTERVIEW

If this is a NEW session (no BUILD-STATE):
1. Create `_BUILD/` and `_BUILD/CONTEXT/` directories
2. Create `_BUILD/CONTEXT/README.md`:
   ```
   Drop reference files here at any time: wireframes, PRDs, schemas,
   API docs, brand guides, screenshots, legacy system notes.
   ```
3. Say: **"Build folder ready. Drop reference docs into `_BUILD/CONTEXT/` at any time. Starting interview."**

**Ask ONE question at a time. Wait for the answer. Then ask the next.**

Rules:
- ONE question per response. Never batch.
- Acknowledge each answer. If unclear or risky, follow up before moving on.
- Add questions if complexity appears. Skip questions that don't matter.
- Give feedback: "Good call because..." or "Heads up — X might cause Y."
- Reference context docs naturally.

Topics (order follows conversation):
- What and why
- Who uses it
- What exists that this touches
- Tech constraints / preferences
- Integrations, data model, auth
- Deployment, timeline, priorities

When confident: **"I have what I need. Generating the build spec now."**

---

### STAGE 2 — SCOPE + DOCS

Determine scope:

**FEATURE** = fewer than 8 files, single concern.
**APP** = new project or major rebuild, 8+ files.

#### Generate Docs (always)

**`_BUILD/PROJECT-SPEC.md`** (Gates format):
```
# [Project Name] — PROJECT SPEC
## Gate 0: Vision — problem, users, success metrics
## Gate 1: Architecture — stack, system diagram (mermaid), data model, auth
## Gate 2: Features — P0/P1/P2 list, user stories, acceptance criteria
## Gate 3: Implementation Plan — dependency order, complexity (S/M/L), file paths
## Gate 4: Infrastructure — env vars, services, CI/CD, hosting, domains
## Gate 5: Launch Checklist — security, Lighthouse >90, WCAG AA, SEO, error pages, onboarding, branded emails, data export, mobile
```

**`_BUILD/BUILD-STATE.md`**:
```
# BUILD STATE
## Status: [IN PROGRESS / PAUSED / COMPLETE]
## Current Stage: [INTERVIEW / SPEC / BUILDING Feature N / VERIFYING]
## Current Feature: [name]
## Completed: (✅ list)
## Remaining: (⬜ list)
## Decisions Made: (architectural choices log)
## Blockers: (waiting on user/external)
## Context Docs: (files in _BUILD/CONTEXT/)
## Last Updated: [timestamp]
```

**`_BUILD/STARTUP.md`** (new machine setup — auto-detect stack):
```
# Project Setup — New Machine

## Prerequisites
[Auto-detected: Node.js version from .nvmrc/package.json engines, Python version, etc.]

## 1. Install Dependencies
[Auto-generated based on detected stack: npm install, pip install, bundle install, etc.]

## 2. Environment Variables
Copy the example env file and fill in real values:
[Auto-detected: cp .env.example .env.local, or cp .env.template .env, etc.]
Open the file and replace all placeholder values. Never commit this file.

## 3. Database Setup
[If applicable: migration commands, seed commands]

## 4. Verify Setup
[Auto-generated: npm run typecheck, npm run build, pytest, etc.]

## 5. Start Development
[Auto-generated: npm run dev, python manage.py runserver, etc.]

## 6. Resume Build
Tell Claude Code: "setup done"
```

**`_BUILD/README-DRAFT.md`** and **`.env.example`** in project root.

#### If APP mode, also create `_BUILD/MASTER.md`:
```
# Master Build Plan
## Features (dependency order):
  1. ⬜ [Feature] — description (files)
## Shared Dependencies — install commands, migrations
## Infrastructure First — pre-Feature-1 setup
```

Respond: **"Project docs generated. Review PROJECT-SPEC.md and say GO."**

APP mode after GO → Stages 3-4 per feature. Between features:
**"Feature [N] complete ✅ — Starting Feature [N+1]: [name]. GO or PAUSE."**

---

### STAGE 3 — PROMPT

1. `cat CODEBAKERS.md`
2. `cat _BUILD/PROJECT-SPEC.md`
3. If APP mode, `cat _BUILD/MASTER.md` and `_BUILD/BUILD-STATE.md`
4. Re-read relevant `_BUILD/CONTEXT/` files
5. Create `_BUILD/PROMPT.md`:
```
# BUILD PROMPT
## What and why
## Current codebase state
## Reference docs consulted
## Steps in order (file paths, function names)
## CodeBakers patterns (pasted inline)
## What NOT to do
## Verification checklist (8+ items with how to test)
```

Respond: **"Prompt ready. Building now."**

Then `cat _BUILD/PROMPT.md` from disk before writing any code.

---

### STAGE 4 — BUILD + VERIFY

Execute the prompt. Follow build order. When done:

1. `cat _BUILD/PROMPT.md` — re-read verification from disk
2. Test each checkbox, report pass/fail
3. Fix failures, re-verify until clean
4. Delete `_BUILD/PROMPT.md`
5. Update `_BUILD/BUILD-STATE.md`
6. If APP mode, mark feature ✅ in `_BUILD/MASTER.md`
7. After ALL features: finalize `README.md` in project root

---

## CONTEXT HEALTH — REPORT AFTER EVERY STAGE

**After completing any stage or feature build, report:**

```
── Context Health ──────────────────────
Tokens used:     ~[estimate]
Tokens remaining: ~[estimate]
Stages remaining: [list what's left]
Can complete next stage: [YES / LIKELY / NO]
Recommendation: [CONTINUE / HANDOFF]
────────────────────────────────────────
```

If remaining tokens < 40k, recommend HANDOFF and auto-run handoff protocol.

---

## HANDOFF PROTOCOL

Triggers: context low, user pauses, session ending.

1. Update `_BUILD/BUILD-STATE.md` with exact current state.
2. Create `_BUILD/HANDOFF.md`:
```
# SESSION HANDOFF
## Resume: say "read CLAUDE.md and resume"
## What Was Happening: [exact state]
## What's Done: [completed list]
## What's Next: [specific next step]
## Open Questions: [needs user input]
## Watch Out For: [gotchas, bugs found]
```
3. Say: **"Handoff created. New session → 'read CLAUDE.md and resume.' Everything saved in `_BUILD/`."**

---

## CRASH RECOVERY

User says **"read CLAUDE.md and resume"** in new terminal. Claude Code:

1. Confirm PPBV Active
2. Run Fresh Clone Check
3. `cat _BUILD/BUILD-STATE.md`
4. `cat _BUILD/HANDOFF.md` if exists
5. `cat _BUILD/PROJECT-SPEC.md`
6. `cat _BUILD/MASTER.md` if APP mode
7. Check git status for uncommitted/partial changes
8. Report findings, continue from documented point
9. If partial file found: "I see [file] was partially written. Finish it or start fresh?"

---

## UNIVERSAL CODE RULES

- TypeScript strict. No `any`. No untyped `as` casts.
- Validate inputs at boundaries. Never trust user data.
- Every action: loading, success, error states.
- No hardcoded values. Env vars or constants.
- Components: single job, default export, typed props.
- Mobile-first. WCAG AA. Semantic HTML.
- Handle: empty, error, loading, unauthorized, timeout.
