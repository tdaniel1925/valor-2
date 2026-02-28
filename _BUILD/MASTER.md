# MASTER BUILD PLAN

## Features (Dependency Order):

1. ✅ **Multi-Tenant Foundation** — Add Tenant model, update all schemas, implement RLS, update API routes
   - **Complexity**: L (Large)
   - **Duration**: 5-7 days ✅ COMPLETED
   - **Files**: ~30 (schema, migrations, middleware, 80+ API route updates)
   - **Tests**: 8 tenant isolation tests ✅ ALL PASSING
   - **Dependencies**: None (foundational)
   - **Status**: ✅ COMPLETE - Production verified with RLS enforcement

2. ✅ **Tenant Onboarding** — Signup flow, slug generation, email setup instructions
   - **Complexity**: M (Medium)
   - **Duration**: 2-3 days ✅ COMPLETED IN 1 SESSION
   - **Files**: 6 (all created)
   - **Tests**: Manual testing ready
   - **Dependencies**: Feature 1 ✅ (needs Tenant model)
   - **Blocker Risk**: Low
   - **Status**: ✅ COMPLETE - Ready for testing & deployment

3. ✅ **SmartOffice ETL Service** — Excel parsing, validation, webhook integration, upsert logic
   - **Complexity**: L (Large)
   - **Duration**: 4-5 days ✅ COMPLETED
   - **Files**: 3 new + 2 existing (webhook, storage helpers, bucket setup + parser/import already existed)
   - **Tests**: Manual testing ready
   - **Dependencies**: Feature 1 ✅ (needs tenantId scoping)
   - **Blocker Risk**: Medium (external dependency: Zapier/Supabase Storage)
   - **Status**: ✅ COMPLETE - Webhook auto-sync ready, needs Supabase Storage configuration

4. ✅ **SmartOffice Dashboard** — Policy/agent grids, search, filters, export, AI chat
   - **Complexity**: M (Medium)
   - **Duration**: 3-4 days ✅ COMPLETED IN 2 DAYS (8 milestones)
   - **Files**: 21 created, ~2,600+ lines of code
   - **Tests**: Manual testing complete
   - **Dependencies**: Feature 3 ✅ (needs data to display)
   - **Blocker Risk**: Low
   - **Status**: ✅ COMPLETE - Deployed to production (Phase 4)
   - **Milestones**: Data grid, Quick Actions, AI Chat, Advanced Filters, CSV Export, Mobile, Polish

5. 🚀 **Advanced Dashboard Features (Phase 5)** — Detail pages, charts, custom layouts
   - **Complexity**: L (Large)
   - **Duration**: 15-19 hours (2-3 days) - **IN PROGRESS (80% complete)**
   - **Files**: ~40 new files (~32 created so far)
   - **Tests**: 25+ E2E scenarios
   - **Dependencies**: Feature 4 ✅ (builds on dashboard)
   - **Blocker Risk**: Medium (complex UI patterns)
   - **Sub-features**:
     - 5.1: Policy Detail Page (2-3h) ✅ COMPLETE
     - 5.2: Agent Detail Page (2h) ✅ COMPLETE
     - 5.3: Charts & Visualizations (3-4h) ✅ COMPLETE
     - 5.4: Custom Dashboard System (6-8h) ⬜ NEXT
     - 5.5: Saved Filter Presets (2h) ✅ COMPLETE

6. ⬜ **Testing & Polish** — E2E suite completion, performance optimization, accessibility
   - **Complexity**: M (Medium)
   - **Duration**: 3-4 days
   - **Files**: N/A (test files)
   - **Tests**: 30 comprehensive E2E scenarios
   - **Dependencies**: All features complete
   - **Blocker Risk**: Low

---

## Shared Dependencies

### Install Commands
```bash
# Already installed (verified)
npm install

# Phase 4 packages (installed):
npm install @anthropic-ai/sdk@0.34.1
npm install ai@4.0.24
npm install csv-stringify@6.5.2

# Phase 5 packages (needed):
npm install recharts@^2.15.0
npm install react-grid-layout@^1.4.4
npm install date-fns@^3.6.0
npm install @dnd-kit/core@^6.1.0
npm install @dnd-kit/sortable@^8.0.0

# Dev dependencies:
npm install -D @playwright/test@latest
npm install -D vitest@latest
npm install -D @vitest/ui@latest
npm install -D @types/react-grid-layout
```

### Database Migrations
```bash
# Generate migration for multi-tenant schema
npx prisma migrate dev --name add_multi_tenant_foundation

# Generate migration for SmartOffice tables
npx prisma migrate dev --name add_smartoffice_intelligence

# Deploy to remote (after local testing)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Environment Setup
- See `_BUILD/STARTUP.md` for complete setup instructions
- Critical: Add Anthropic API key to `.env.local`
- Critical: Configure Supabase Storage bucket & webhook
- Critical: Set up Zapier integration (manual step)

---

## Infrastructure First (Pre-Feature-1 Setup)

### DNS Configuration
1. Add wildcard DNS for `*.valorfs.app` pointing to Vercel
2. Verify DNS propagation: `nslookup test.valorfs.app`

### Supabase Storage
1. Create bucket: `smartoffice-reports` (private)
2. Configure webhook: Storage INSERT → `https://valorfs.app/api/smartoffice/webhook`
3. Generate webhook secret, add to env vars

### Vercel Configuration
1. Add environment variables (see `.env.example`)
2. Enable Vercel Edge Middleware
3. Configure custom domains in dashboard
4. Set up preview deployments for PRs

### Zapier Setup (After Feature 2 Complete)
1. Create Zap: Gmail (New Email) → Extract Attachment → Upload to Supabase
2. Filter: To address contains `@reports.valorfs.app`
3. Test with sample email
4. Enable Zap

---

## Critical Path

**Week 1**: Feature 1 + Feature 2 (Multi-tenant + Onboarding)
- **Milestone**: Users can sign up, get subdomain, and see empty dashboard
- **Verification**: Playwright test signs up 3 tenants, verifies isolation

**Week 2**: Feature 3 (ETL Service)
- **Milestone**: Excel files automatically sync to database
- **Verification**: Upload test file to Storage, verify data appears in UI

**Week 3**: Feature 4 + start Feature 5 (Dashboard + AI Chat)
- **Milestone**: Users can search policies, ask AI questions
- **Verification**: E2E test: signup → sync → search → chat query

**Week 4**: Complete Feature 5 + Feature 6 (AI Chat + Testing)
- **Milestone**: All features complete, tests passing, launch-ready
- **Verification**: Run full E2E suite (30 scenarios), Lighthouse >90

---

## Build Order Rationale

1. **Foundation First**: Can't build features without tenant isolation
2. **Onboarding Early**: Validates tenant creation logic before adding complexity
3. **Data Pipeline Next**: ETL must work before dashboard has value
4. **UI After Data**: Dashboard meaningless without data to display
5. **AI Last**: Most complex, depends on stable data model
6. **Polish Final**: Can't optimize until features are complete

---

## Risk Management

### High-Risk Features (Extra attention needed):
- **Feature 1** (Multi-Tenant): Touches entire codebase, potential for bugs
  - Mitigation: Extensive testing, gradual API route updates, RLS safety net
- **Feature 3** (ETL): External dependencies (Zapier, email, Excel format changes)
  - Mitigation: Robust validation, error handling, manual upload fallback
- **Feature 5** (AI Chat): SQL injection risk, API costs
  - Mitigation: Parameterized queries only, query whitelisting, rate limiting

### Potential Blockers:
- DNS propagation delays (can take 24-48 hours)
- Zapier reliability (monitor task history)
- Anthropic API rate limits (start with low tier, upgrade if needed)
- Database migration failures (test in staging first)

---

**Last Updated**: 2026-02-28 (Phase 4 Complete, Starting Phase 5)
**Total Estimated Duration**: 23-28 days (4-5.5 weeks)
**Actual Progress**: Phase 4 complete (8/8 milestones), starting Phase 5
**Team Size Assumption**: 1 full-time developer
**Velocity**: Significantly ahead of schedule (Phase 4 done in 2 days vs 3-4 estimated)

---

## Phase 2 Completion Summary

**Files Created**:
1. `lib/tenants/slug-validator.ts` - Validation logic + reserved slugs
2. `app/api/auth/check-slug/route.ts` - Real-time availability check
3. `app/api/auth/signup/route.ts` - Signup with Tenant + User creation
4. `app/(auth)/signup/page.tsx` - Form with validation
5. `app/onboarding/success/page.tsx` - Post-signup success screen
6. `app/onboarding/verify-email/page.tsx` - Email verification handler

**TypeScript Status**: ✅ 0 errors in Phase 2 files
**RLS Integration**: ✅ Signup creates users with proper RLS context
**Ready For**: Manual testing → Production deployment
