# BUILD STATE

## Status: AI TOOLS — code COMPLETE ✅ (2 user actions to go live)

## Current Build: SmartViews AI Tools → Valor "AI TOOLS" category (11 tools, APP mode)
- Report/plan: _BUILD/SMARTVIEWS-AI-INTEGRATION-REPORT.md ; decisions in memory project-smartviews-ai-integration.
- BUILT (tsc + next build pass 2026-06-23): Foundation [lib/ai/{claude,prompts,valor-data-adapter,tools,tool-executor,route-helpers}.ts], 4 new Prisma models (AiFinding/AiChatMemory/AiEmailDraft/AiCoachingPlan) + scripts/ai-tools-schema.sql, AI TOOLS sidebar (aiToolsNavigation, all users, desktop+mobile). Phase 1+2 = 11 routes app/api/ai/** + 11 pages app/ai/** + components/ai/{AiToolShell,AiInsightRunner}.tsx.
- Data layer verified: scripts/ai-tools-smoke-test.mjs 7/7 (rollups/buckets/cross-sell vs live 4,638-policy book). All 283 advisors join to agents by name.
- Live test confirmed full pipeline works (auth→tenant→adapter→Claude). Claude calls return 401 invalid x-api-key.
- ✅ ANTHROPIC_API_KEY refreshed (new key works). ANTHROPIC_MODEL set to claude-sonnet-4-5 (claude-3-5-sonnet-20241022 was retired → 404). maxRetries:5 added to lib/ai/claude.ts for transient 5xx. (.env.local is gitignored — these stay local.)
- ✅ Live-verified end-to-end with real data: Search (NL→filter), Benchmarking (283 advisors, real medians), Report Builder ($77.7M cited) all returned 200 with correct output. Data layer 7/7. Pipeline (auth→tenant→adapter→Claude) proven correct.
- ⚠️ During testing the Anthropic API had recurring transient `api_error 500` waves (request-time dependent, NOT param/code related — confirmed by isolation: identical calls pass/fail by wall-clock window). maxRetries mitigates; not a build defect.
- ⬜ USER ACTION: run scripts/ai-tools-schema.sql in Supabase SQL Editor (app DB role can't run DDL — confirmed 42501 permission denied even on DIRECT_URL). Enables persistence for Revenue Intelligence / Agent Coach / Meeting Prep / Smart Emails. The other 7 tools work without it.
- NOTE: legacy app/api/smartoffice/chat/route.ts still has the eval() RCE pattern — superseded by /api/ai/chat; remove/redirect it in a follow-up.

---
## (Prior) LMS BUILD — Status: COMPLETE ✅
## Current Stage: DONE — all 7 features built (tsc + next build pass) AND runtime smoke test passed 33/33 (2026-06-12, scripts/lms-smoke-test.mjs vs live Supabase: full admin flow, agent lock states, no-skip heartbeat clamping, completion, reports, CSV, tenant isolation). RLS disabled on course_grants/training_settings via Supabase SQL Editor (lms-schema.sql §6).

## Current Feature: Valor Learning Center (LMS) — APP mode, 7 features

## Completed:
✅ Prior builds: SmartOffice system, FireLight SFTP receiving side (see git history / _BUILD archives)
✅ LMS interview complete (2026-06-11)
✅ LMS spec generated: `_BUILD/LMS/PROJECT-SPEC.md`
✅ LMS master plan: `_BUILD/LMS/MASTER.md`

## Remaining:
✅ GO received; Feature 1 complete (schema extended, validated, client generated, tsc clean)
⬜ USER ACTION: run `scripts/lms-schema.sql` in Supabase SQL Editor
⬜ Feature 2: API Layer
⬜ Feature 3: Admin Course Builder
⬜ Feature 4: Agent Learning Center
✅ Feature 5: No-Skip Player (NoSkipPlayer.tsx + lesson page; tsc + build pass 2026-06-11)
✅ Feature 6: Reports + CSV (lib/learning/reports.ts + reports API/export + admin reports page; tsc + build pass 2026-06-11)
✅ Feature 7: Sidebar + Polish (AppLayout nav swap, README finalized; tsc + build pass 2026-06-11)
✅ Runtime smoke test PASSED 33/33 (2026-06-12). Found + fixed 2 RLS bugs along the way: (1) code — resolveLessonContext + findTenantLesson used `course:` relation joins outside withTenantContext (silently match nothing under RLS); (2) DB — course_grants/training_settings had RLS enabled with no policies; disabled via Supabase SQL Editor (lms-schema.sql §6). Test script kept at scripts/lms-smoke-test.mjs (self-cleaning, reusable as regression test).

## Decisions Made:
- YouTube unlisted videos; custom no-skip player (play/pause/rewind only, server-validated progress)
- Sequential lessons; gating per ALL/role/user; locked = greyed + customizable unlock message (per-course override + global default)
- Full reporting: dashboard, completion lists, per-agent transcripts, CSV
- DDL via Supabase SQL Editor (valor_app_role lacks owner perms); RLS disabled on lms_* tables, tenant scoping in API layer (firelight_* precedent)
- Phil Resch (admin) is sole content creator

## Blockers:
- (Separate track) FireLight SSO: spec fully researched → firelight/SSO-REQUIREMENTS.md (SAML 2.0 IdP-initiated POST to uat/www.firelighteapp.com/egapp/idp-initiatedsso.aspx; all claim URIs known; ORGANIZATION_ID=3954, EXTERNAL_ROLE_CODE=VFS_Agent; certs sent). Remaining from Hexure: CarrierCode + Issuer-registration confirmation (+ USER_RIGHTS Full/Limited). Our side: CompanyProducerID field on User model. Then build per plan in that doc.

## Context Docs: _BUILD/CONTEXT/ (none LMS-specific yet)

## Last Updated: 2026-06-11
