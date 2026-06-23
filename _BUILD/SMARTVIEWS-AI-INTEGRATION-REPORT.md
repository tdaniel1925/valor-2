# SmartViews AI Tools → Valor Integration Report

**Date:** 2026-06-23
**Source repo:** `C:\dev\1 - SmartViews\smartviews-app`
**Target:** Valor app (`C:\dev\valor-2`), new sidebar category **AI TOOLS**

---

## 1. Executive summary

SmartViews is a Next.js 16 insurance-analytics app with **~20 Claude-powered AI tools**
built on the same domain as Valor (agents, policies, contracts, carriers, premiums).
The AI *logic and prompts are highly reusable*, but the tools are **wired to a different
data layer**: SmartViews queries its own **Supabase tables directly** with **snake_case**
columns (`policies`, `agents`, `comm_ann_prem`, `first_name`), while Valor reads
SmartOffice data through **Prisma** models `SmartOfficePolicy`/`SmartOfficeAgent` with
**camelCase** columns, scoped by `withTenantContext`.

**The integration is therefore not a copy-paste.** Every tool's data access must be
re-pointed from `supabase.from("policies")` to Valor's `lib/smartoffice/data-service.ts`.
The good news: Valor **already has Anthropic wired** (`@anthropic-ai/sdk` installed,
`ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` set, an existing `app/api/smartoffice/chat`
route), so the AI plumbing exists — we adapt the data layer, not the AI layer.

**Recommended approach:** port a **prioritized subset** through a single Valor-native
data adapter, not all 20 at once. Phase 1 (chat + 4 read-only insights) is the high-value,
low-risk core.

---

## 2. SmartViews stack

| Aspect | SmartViews | Valor (target) |
|---|---|---|
| Framework | Next.js 16 (App Router, `src/` dir) | Next.js 16 (App Router, no `src/`) |
| Data access | Supabase JS client, direct `.from()` | **Prisma** + `withTenantContext` |
| Column case | **snake_case** | **camelCase** |
| AI SDK | `@anthropic-ai/sdk` 0.90 + `@ai-sdk/anthropic` | `@anthropic-ai/sdk` already present |
| Claude model | `claude-sonnet-4-20250514` (all 24 calls) | `ANTHROPIC_MODEL` env (already set) |
| Gemini | `@google/generative-ai` (TTS + image) | not present — needed only for voice/news |
| Multi-tenant | `org_id` on every row | `tenantId` + RLS (`valor-default-tenant`) |

> Note: SmartViews pins `claude-sonnet-4-20250514`. In Valor, route all calls through the
> existing `ANTHROPIC_MODEL` env var instead of hardcoding, so we control the model centrally.
> Latest available models include Fable 5 / Opus 4.8 / Sonnet 4.6 — confirm desired tier per tool.

---

## 3. The 20 AI tools (from SmartViews `src/app/api/ai/*`)

Verified present: anomalies, chat, chat-memory, chat-opening, report, report-builder,
benchmarking, search, revenue-intelligence, industry-news, article-summary, meeting-prep,
zen (+ zen/suggestions), agent-coach, carrier-intelligence, cross-sell, sync-health,
smart-emails, daily-briefing, voice-briefing.

### Suggested categorization for Valor "AI TOOLS"

| Tool | What it does | Provider | Port difficulty | Phase |
|---|---|---|---|---|
| **AI Chat / Assistant** | NL Q&A over book of business via Claude tool-use | Claude | Medium (tool executor rewrite) | **1** |
| **NL Search** | Natural-language → filtered policy/agent search | Claude | Medium | **1** |
| **Revenue Intelligence** | Structured findings (severity/category) on premium/production | Claude | Low–Med | **1** |
| **Cross-Sell** | Per-agent cross-sell recommendations from policy mix | Claude | Low | **1** |
| **Anomalies** | Flags unusual decline/inactivity/premium patterns | Claude | Medium | **1** |
| **Agent Coach** | Coaching plan per agent from production data | Claude | Medium | 2 |
| **Carrier Intelligence** | Per-carrier performance analysis | Claude | Low–Med | 2 |
| **Benchmarking** | Agent vs. peer production benchmarks | Claude | Medium | 2 |
| **Meeting Prep** | Pre-meeting brief on an agent/client | Claude | Low | 2 |
| **Report Builder / Report** | AI-generated reports over the data | Claude | Medium | 2 |
| **Smart Emails** | Draft agent/client emails with context | Claude + Resend | Med (email infra) | 2 |
| **Daily Briefing** | Nightly summary (text) | Claude | Med (cron + table) | 3 |
| **Voice Briefing** | Briefing → Gemini TTS audio | Claude + **Gemini** | High (new provider) | 3 |
| **Industry News / Article Summary** | Fetch + summarize insurance news | **Gemini** + news API | High (external API) | 3 |
| **Zen (+ suggestions)** | Contextual chat w/ memory + suggested prompts | Claude | Med (chat_memory table) | 3 |
| **Chat Memory / Chat Opening** | Conversation persistence + openers | Claude / storage | Med | 3 |
| **Sync Health** | AI analysis of sync logs | Claude | Low (but Valor sync differs) | 3 |

---

## 4. Shared infrastructure to port

**AI client + prompt assets (`src/lib/ai/`):**
- `claude.ts` — `new Anthropic()` singleton (trivial; Valor has its own)
- `prompts.ts` — **the main reusable asset**: 100+ lines of insurance domain context/system prompts
- `studio-prompts.ts` — prompt variants
- `tools.ts` — 15+ Claude tool definitions (search_agents, search_policies, get_summary_stats, get_top_producers, get_premium_analysis, get_agent_production, etc.)
- `tool-executor.ts` — **maps Claude tool calls → Supabase `.from()` queries** ← THE file that must be rewritten for Prisma/data-service
- Supporting: `revenue-intelligence.ts`, `agent-scoring.ts`, `automation-engine.ts`, `nl-search.ts`, `daily-briefing.ts`, `voice-generator.ts`, `news-fetcher.ts`

**Env vars referenced:** `ANTHROPIC_API_KEY` (✅ Valor has), `GEMINI_API_KEY` (needed only for voice/news), `SUPABASE_*` (N/A — Valor uses Prisma), `SO_API_ENDPOINT/SO_SITENAME/SO_USERNAME/SO_API_KEY/SO_API_SECRET` (SmartViews' own SmartOffice creds — **not needed**, Valor reads the synced copy).

**DB tables the tools touch (SmartViews, snake_case):** `policies, agents, contracts, carriers, products, requirements, ai_findings, ai_coaching_plans, article_summaries, automation_rules, chat_memory, daily_briefings, email_drafts, enriched_agent_data, sync_jobs, sync_logs`.
→ In Valor: read data from `SmartOfficePolicy`/`SmartOfficeAgent`; the **AI-output tables** (ai_findings, chat_memory, daily_briefings, email_drafts, ai_coaching_plans, etc.) are **new Prisma models** we must add (DDL via Supabase SQL Editor per project rules; RLS disabled, tenant-scoped in API).

---

## 5. Coupling / portability risks (ranked)

1. **Data layer rewrite (highest effort).** `tool-executor.ts` and every route call
   `supabase.from("policies").select("comm_ann_prem,...")`. Valor must replace these with
   `data-service.ts` calls and map snake_case→camelCase (`comm_ann_prem`→`commAnnualizedPrem`,
   `first_name`→`firstName`, `policy_number`→`policyNumber`, `npn`→(Valor agents have NO NPN —
   match by **email** per DATA-SOURCE-HANDOFF.md)).
2. **Status-code semantics.** SmartViews prompts assume numeric policy statuses (5=Active,
   12=Submitted, 19=Pending). Valor stores string statuses ("Inforce", "Pending", "Submitted").
   Prompts + tool filters need re-mapping.
3. **New AI-output tables.** Findings, chat memory, briefings, email drafts, coaching plans
   need new tenant-scoped tables in Valor's DB.
4. **Tenant model.** Every SmartViews query is `org_id`-scoped; Valor is `tenantId` + RLS via
   `withTenantContext`. Straightforward but must be applied to every ported route.
5. **Gemini dependency.** Voice briefing + news/article summary need `@google/generative-ai`
   and `GEMINI_API_KEY` — a brand-new provider for Valor. Defer to Phase 3 or skip.
6. **Email + cron.** Smart Emails (Resend) and Daily/Voice Briefing (nightly job) need
   Valor's email service + a scheduler. Defer.
7. **News fetcher.** External insurance-news API of unknown provenance — verify keys/cost.

---

## 6. Recommended integration plan

### Foundation (do once)
- **`lib/ai/valor-data-adapter.ts`** — the bridge: implements each SmartViews "tool" against
  `lib/smartoffice/data-service.ts` + `lib/downline/service.ts`, returning the shapes the
  ported tool-executor expects (with camelCase→snake_case-free field mapping done here).
- **`lib/ai/prompts.ts`** — port + retune domain prompts for Valor's string statuses and
  email-based agent matching.
- Centralize model id on `process.env.ANTHROPIC_MODEL` (no hardcoded `claude-sonnet-4`).
- New Prisma models + SQL for AI-output tables (ai_findings, chat_memory, etc.), tenant-scoped.

### Sidebar: new **AI TOOLS** category
Add an `aiToolsNavigation: NavItem[]` array in `components/layout/AppLayout.tsx` (mirroring
`learningNavigation`/`adminNavigation` at lines ~321/348) and render it under an "AI TOOLS"
section header. Gate visibility by role/tenant as desired.

### Phase 1 (core, ~1–2 wk): Chat, NL Search, Revenue Intelligence, Cross-Sell, Anomalies
All read-only over existing synced data; highest value, no new external providers.

### Phase 2 (~1–2 wk): Agent Coach, Carrier Intelligence, Benchmarking, Meeting Prep, Report Builder, Smart Emails
Adds AI-output persistence + email infra.

### Phase 3 (optional): Daily/Voice Briefing, Industry News, Zen + memory, Sync Health
Requires Gemini, cron, external news API — evaluate cost/benefit before committing.

> The Explore agent's rough estimate of 40–60 dev-days assumed schema parity. With the
> adapter approach and a phased subset, **Phase 1 is realistically a few days**; full port
> is large mostly because of Phase 3's new providers/infra.

---

## 6b. Decisions + verified data findings (2026-06-23)

**Decisions made:** Scope = **Phase 1 + 2 (11 tools)**; **skip Gemini** (Claude-only);
AI TOOLS sidebar visible to **all users**.

**Live-data verification (de-risks the plan):**
- ✅ **R1 RESOLVED — agent↔policy link works.** All **283/283** distinct
  `SmartOfficePolicy.primaryAdvisor` values match `SmartOfficeAgent.fullName` exactly.
  Per-agent tools (Cross-Sell, Agent Coach, Benchmarking) join policies→agents on advisor
  name. (Top advisors: Russ Oxendine 647 policies, Theodore Pappas 373, …)
- ✅ **Agent match key = email** (683/692 = 99% have email; **0 have NPN**) — matches
  DATA-SOURCE-HANDOFF.md. NPN is NOT a usable join.
- ✅ **Date fields:** policies have `statusDate`, `importDate` (no `created_on`) — date-window
  logic (anomalies, stalled policies) uses **`statusDate`**.
- ⚠️ **No `contracts` / `requirements` tables, no agent `production_score`/`hire_date`.**
  Confirmed: drop contract/requirement tools; Agent Coach/Benchmarking use **proxy metrics**
  (premium, policy count, recency) instead of scores.
- Status strings confirmed earlier: "Inforce" (3,289), "Pending" (29), "Submitted",
  "Declined" (400), etc. — numeric→string map validated.

**Two landmines in Valor's existing AI code (fix during build):**
1. `ANTHROPIC_MODEL=claude-3-5-sonnet-20241022` is outdated → bump to a current model;
   centralize on the env var (don't hardcode SmartViews' `claude-sonnet-4-20250514`).
2. `app/api/smartoffice/chat/route.ts:~226` runs **`eval()` on a Claude-generated query
   string** (RCE-adjacent). The ported typed tool-use executor **replaces** this.

## 7. Open questions for you (before building)

1. **Which tools matter most?** I recommend Phase 1's five. Confirm or reprioritize.
2. **Model tier:** keep Sonnet-class for cost, or use a higher tier (Opus/Fable) for the
   flagship Chat? (Valor's `ANTHROPIC_MODEL` currently set — confirm value.)
3. **Voice + News (Gemini):** in scope, or skip? They're the only non-Anthropic pieces.
4. **Who sees AI Tools?** All agents, or admins/executives only (per role)?
5. **Email/cron tools:** does Valor already have an email sender + scheduler we reuse?
