# Valor SaaS Platform + SmartOffice Intelligence — PROJECT SPEC

## Gate 0: Vision

### Problem
Insurance agencies using SmartOffice face critical pain points:
1. **Manual data export** - Agents must click through SmartOffice UI to get reports
2. **No search/filter** - Can't quickly find specific policies or agents
3. **No historical tracking** - Data is ephemeral, no trend analysis
4. **Rigid reporting** - Custom reports require extensive manual work
5. **Single-tenant limitation** - Current Valor platform can't scale to multiple agencies

### Users
**Primary**: Insurance agency owners and agents who use SmartOffice for policy management
**Secondary**: Agency managers who need team performance insights

### Success Metrics
1. **Onboarding**: <2 min from signup to first SmartOffice sync configured
2. **Data freshness**: Reports synced within 2 minutes of email arrival
3. **Search speed**: <500ms for policy/agent queries
4. **Tenant isolation**: Zero cross-tenant data leakage incidents
5. **Adoption**: 80% of users engage with AI chat within first week

---

## Gate 1: Architecture

### Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Auth**: Supabase Auth with tenant resolution middleware
- **Storage**: Supabase Storage for Excel files
- **Email**: Zapier → catch-all inbox → Supabase Storage webhook
- **AI**: Anthropic Claude API (claude-3-5-sonnet)
- **Testing**: Playwright (E2E), Vitest (unit)
- **Deployment**: Vercel with wildcard DNS

### System Diagram

```mermaid
graph TB
    subgraph "User Access"
        A[User Browser] -->|agency1.valorfs.app| B[Vercel Edge]
        B --> C[Middleware: Tenant Resolution]
    end

    subgraph "Multi-Tenant Core"
        C --> D[Next.js App Router]
        D --> E[API Routes with Tenant Context]
        E --> F[Prisma Client]
        F --> G[PostgreSQL + RLS]
    end

    subgraph "SmartOffice Data Pipeline"
        H[SmartOffice] -->|Email Report| I[Gmail Inbox]
        I --> J[Zapier]
        J -->|Upload .xlsx| K[Supabase Storage]
        K -->|Webhook| L[/api/smartoffice/webhook]
        L --> M[ETL Service]
        M -->|Validate & Parse| N[SmartOfficePolicy/Agent Tables]
        N --> G
    end

    subgraph "AI Intelligence"
        O[User Query] --> P[AI Chat API]
        P --> Q[Anthropic Claude]
        Q -->|Generate SQL| R[Query Executor]
        R --> G
        R --> S[Results + Visualization]
    end

    subgraph "Tenant Management"
        T[Signup Flow] --> U[Create Tenant]
        U --> V[Generate Custom Slug Email]
        V --> W[Configure Zapier Filter]
        W --> K
    end
```

### Data Model

**New Multi-Tenant Foundation:**
```prisma
model Tenant {
  id              String   @id @default(uuid())
  name            String   // Agency name
  slug            String   @unique  // For subdomain & email

  // Email configuration
  emailSlug       String   @unique  // {slug}@reports.valorfs.app
  emailVerified   Boolean  @default(false)
  lastSyncAt      DateTime?

  // Future billing
  plan            String?  @default("free")
  status          TenantStatus @default(ACTIVE)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations (ALL data scoped to tenant)
  users           User[]
  organizations   Organization[]
  cases           Case[]
  quotes          Quote[]
  commissions     Commission[]
  smartOfficePolicies  SmartOfficePolicy[]
  smartOfficeAgents    SmartOfficeAgent[]
  smartOfficeReports   SmartOfficeCustomReport[]
  smartOfficeChatHistory SmartOfficeChatHistory[]
  syncLogs        SmartOfficeSyncLog[]
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CHURNED
}
```

**SmartOffice Intelligence Schema** (from earlier):
- `SmartOfficePolicy` - Policies with financial data
- `SmartOfficeAgent` - Agent directory
- `SmartOfficeSyncLog` - Import audit trail
- `SmartOfficeCustomReport` - Saved reports
- `SmartOfficeChatHistory` - AI conversations

**Updated Core Models** (add tenantId to all):
```prisma
model User {
  id        String  @id
  tenantId  String  // NEW - Required
  tenant    Tenant  @relation(...)
  // ... rest
}

model Case {
  id        String  @id
  tenantId  String  // NEW - Required
  tenant    Tenant  @relation(...)
  userId    String
  // ... rest
}
// Same pattern for Quote, Commission, Contract, Organization, etc.
```

### Authentication Flow

1. User visits `agency1.valorfs.app`
2. Middleware extracts subdomain → resolves to `tenantId`
3. If no session → redirect to `/login` (stays on subdomain)
4. Supabase Auth validates credentials
5. Middleware verifies user belongs to tenant
6. Injects `x-tenant-id` and `x-user-id` headers
7. All API routes filter by `tenantId` first, then user permissions

**Row Level Security (RLS):**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_policies ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Policy: Users only see data in their tenant
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON smartoffice_policies
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- ... repeat for all tables
```

---

## Gate 2: Features

### P0 (Must-Have for Launch)

#### Feature 1: Multi-Tenant Foundation
**User Story**: As a platform owner, I need complete tenant isolation so agencies' data never mixes.

**Acceptance Criteria:**
- [ ] Add `Tenant` model with slug, email config
- [ ] Add `tenantId` to User, Case, Quote, Commission, Organization
- [ ] Middleware resolves tenant from subdomain
- [ ] RLS policies enforce tenant isolation
- [ ] API routes filter by tenantId on every query
- [ ] Auth prevents cross-tenant access
- [ ] Tests verify data isolation (user from Tenant A cannot access Tenant B data)

#### Feature 2: Tenant Onboarding
**User Story**: As an agency owner, I can sign up and get my custom report email address in <2 minutes.

**Acceptance Criteria:**
- [ ] Signup form: email, password, agency name, custom slug
- [ ] Slug validation (3-30 chars, lowercase, alphanumeric + hyphens, unique)
- [ ] Create tenant + first user (as OWNER role)
- [ ] Generate email: `{slug}@reports.valorfs.app`
- [ ] Show onboarding success page with email instructions
- [ ] Send welcome email with Zapier setup guide
- [ ] Redirect to dashboard on subdomain (`{slug}.valorfs.app`)

#### Feature 3: SmartOffice Data Sync (ETL)
**User Story**: As a user, SmartOffice reports emailed to my custom address automatically appear in my dashboard.

**Acceptance Criteria:**
- [ ] Zapier → Supabase Storage integration configured
- [ ] Webhook endpoint `/api/smartoffice/webhook` receives file upload events
- [ ] ETL service validates file structure (expected columns present)
- [ ] Parse Excel → normalize data → upsert to database
- [ ] Deduplicate by policy number / NPN
- [ ] Log sync result to `SmartOfficeSyncLog`
- [ ] Send email alert on validation failure
- [ ] Admin UI shows sync history with stats (records added/updated/failed)

#### Feature 4: SmartOffice Dashboard
**User Story**: As a user, I see all my policies and agents with search and filters.

**Acceptance Criteria:**
- [ ] `/smartoffice` page shows KPIs (total policies, total premium, top advisors)
- [ ] `/smartoffice/policies` - searchable grid (policy #, advisor, carrier, premium, status)
- [ ] `/smartoffice/agents` - agent directory (name, email, phone, NPN, contracts)
- [ ] Full-text search across all fields
- [ ] Filters: carrier, advisor, policy type, date range, status
- [ ] Sort by any column
- [ ] Pagination (50 records per page)
- [ ] Export to Excel/CSV

#### Feature 5: AI Chat Assistant
**User Story**: As a user, I can ask "Show me all Athene policies over $200k" and get instant results.

**Acceptance Criteria:**
- [ ] `/smartoffice/chat` page with message interface
- [ ] Input: natural language query
- [ ] Backend: send to Claude API with schema context
- [ ] Claude generates SQL query (read-only, tenant-scoped)
- [ ] Execute query safely (parameterized, no mutations)
- [ ] Display results as table + summary
- [ ] Show generated SQL for transparency
- [ ] Store conversation in `SmartOfficeChatHistory`
- [ ] Handle errors gracefully ("I couldn't understand that")

### P1 (High Value, Post-Launch)

#### Feature 6: Custom Report Builder
**User Story**: As a user, I can build custom reports without SQL knowledge.

**Acceptance Criteria:**
- [ ] Drag-and-drop interface
- [ ] Select data source (Policies / Agents)
- [ ] Choose columns to display
- [ ] Apply filters visually
- [ ] Group by / aggregate (SUM, AVG, COUNT)
- [ ] Save report with name
- [ ] Schedule email delivery (daily/weekly/monthly)
- [ ] Share report with team

#### Feature 7: Analytics Dashboard
**User Story**: As a manager, I see trends and insights at a glance.

**Acceptance Criteria:**
- [ ] Premium over time chart
- [ ] Policies by carrier pie chart
- [ ] Top 10 advisors leaderboard
- [ ] New vs renewed policies comparison
- [ ] Commission forecast
- [ ] Lapsed policy alerts

### P2 (Nice-to-Have)

#### Feature 8: Team Management
**User Story**: As an owner, I can invite team members and assign roles.

- [ ] Invite by email
- [ ] Roles: OWNER, ADMIN, MEMBER
- [ ] Deactivate users
- [ ] Audit log of user actions

#### Feature 9: Mobile App
- [ ] Responsive design optimized for mobile
- [ ] PWA for offline access

---

## Gate 3: Implementation Plan

### Phase 1: Multi-Tenant Foundation (Week 1)
**Complexity: L** | **Files: 15** | **Tests: 20**

1. **Database Migration**
   - `prisma/schema.prisma` - Add Tenant model
   - Add tenantId to all core models
   - `prisma/migrations/` - Generate migration
   - **Test**: Schema validation, foreign key constraints

2. **Middleware & Auth**
   - `middleware.ts` - Tenant resolution from subdomain
   - `lib/auth/tenant-context.ts` - Tenant resolution logic
   - `lib/auth/server-auth.ts` - Update to verify tenant access
   - **Test**: Subdomain parsing, tenant isolation, unauthorized access

3. **RLS Policies**
   - `supabase/migrations/add-rls-policies.sql` - Enable RLS on all tables
   - Create tenant isolation policies
   - **Test**: User from Tenant A cannot query Tenant B data

4. **API Route Updates** (80+ files)
   - Update all routes in `app/api/` to filter by tenantId
   - Pattern: `const tenantId = request.headers.get("x-tenant-id");`
   - Add to WHERE clauses: `where: { tenantId, ... }`
   - **Test**: Spot-check 10 critical routes with E2E tests

### Phase 2: Tenant Onboarding (Week 1-2)
**Complexity: M** | **Files: 8** | **Tests: 12**

1. **Signup Flow**
   - `app/(auth)/signup/page.tsx` - Signup form
   - `app/api/auth/signup/route.ts` - Create tenant + user
   - `lib/tenants/slug-validator.ts` - Slug validation
   - `lib/tenants/email-generator.ts` - Generate custom email
   - **Test**: Valid signup, slug collision, invalid inputs

2. **Onboarding Pages**
   - `app/onboarding/success/page.tsx` - Show email setup instructions
   - `app/onboarding/verify-email/page.tsx` - Email verification
   - **Test**: User flow from signup to dashboard

### Phase 3: SmartOffice ETL Service (Week 2)
**Complexity: L** | **Files: 12** | **Tests: 25**

1. **Excel Parser**
   - `lib/smartoffice/excel-parser.ts` - Parse .xlsx files
   - `lib/smartoffice/schema-validator.ts` - Validate columns
   - `lib/smartoffice/data-normalizer.ts` - Clean & normalize data
   - **Test**: Parse sample files, handle malformed data

2. **ETL Service**
   - `lib/smartoffice/etl-service.ts` - Core ETL logic
   - `lib/smartoffice/policy-importer.ts` - Import policies
   - `lib/smartoffice/agent-importer.ts` - Import agents
   - **Test**: Upsert logic, deduplication, error handling

3. **Webhook Integration**
   - `app/api/smartoffice/webhook/route.ts` - Supabase Storage webhook
   - `lib/smartoffice/sync-orchestrator.ts` - Coordinate sync process
   - `lib/notifications/sync-alerts.ts` - Email alerts on failures
   - **Test**: Webhook payload handling, file download, error notifications

4. **Admin UI**
   - `app/smartoffice/sync-history/page.tsx` - Sync log viewer
   - `components/smartoffice/SyncLogTable.tsx` - Display sync stats
   - `app/api/smartoffice/sync/route.ts` - Manual trigger endpoint
   - **Test**: Display logs, trigger manual sync

### Phase 4: SmartOffice Dashboard (Week 3)
**Complexity: M** | **Files: 10** | **Tests: 15**

1. **Dashboard Pages**
   - `app/smartoffice/page.tsx` - Main dashboard with KPIs
   - `app/smartoffice/policies/page.tsx` - Policy grid
   - `app/smartoffice/agents/page.tsx` - Agent directory
   - **Test**: Data display, pagination, tenant isolation

2. **Search & Filters**
   - `lib/smartoffice/search-engine.ts` - Full-text search
   - `components/smartoffice/SearchBar.tsx` - Search input
   - `components/smartoffice/FilterPanel.tsx` - Filter controls
   - **Test**: Search accuracy, filter combinations, performance

3. **Export Functionality**
   - `lib/smartoffice/excel-exporter.ts` - Generate Excel from data
   - `app/api/smartoffice/export/route.ts` - Export endpoint
   - **Test**: Excel generation, large datasets (10k+ rows)

### Phase 5: AI Chat Assistant (Week 3-4)
**Complexity: L** | **Files: 8** | **Tests: 18**

1. **Chat Interface**
   - `app/smartoffice/chat/page.tsx` - Chat UI
   - `components/smartoffice/ChatMessage.tsx` - Message bubble
   - `components/smartoffice/ChatInput.tsx` - Input field
   - **Test**: UI interactions, message history

2. **AI Service**
   - `lib/smartoffice/ai-chat-service.ts` - Anthropic integration
   - `lib/smartoffice/sql-generator.ts` - Natural language → SQL
   - `lib/smartoffice/query-executor.ts` - Safe query execution
   - `lib/smartoffice/query-validator.ts` - SQL safety checks (no mutations)
   - **Test**: SQL generation accuracy, safety validation, error handling

3. **API Endpoints**
   - `app/api/smartoffice/chat/route.ts` - Send message
   - `app/api/smartoffice/chat/history/route.ts` - Get conversation
   - **Test**: Message handling, tenant isolation, rate limiting

### Phase 6: Testing & Polish (Week 4)
**Complexity: M** | **Files: N/A** | **Tests: 30**

1. **E2E Test Suite (Playwright)**
   - `tests/e2e/multi-tenant.spec.ts` - Tenant isolation tests
   - `tests/e2e/smartoffice-sync.spec.ts` - Full sync flow
   - `tests/e2e/ai-chat.spec.ts` - Chat interactions
   - `tests/e2e/export.spec.ts` - Export functionality

2. **Unit Tests (Vitest)**
   - All service files have corresponding `.test.ts`
   - 80%+ code coverage on business logic
   - Mock external APIs (Anthropic, Supabase)

3. **Performance Testing**
   - Load test: 100 concurrent users
   - Database query optimization
   - Add indexes for common queries

---

## Gate 4: Infrastructure

### Environment Variables

**Required (add to `.env.example`):**
```env
# Existing vars remain...

# Multi-Tenancy
NEXT_PUBLIC_ROOT_DOMAIN="valorfs.app"
NEXT_PUBLIC_WILDCARD_SUBDOMAIN_ENABLED=true

# SmartOffice
SMARTOFFICE_SYNC_ENABLED=true
SMARTOFFICE_STORAGE_BUCKET="smartoffice-reports"
SMARTOFFICE_WEBHOOK_SECRET=your-webhook-secret-here

# Zapier Integration
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxx/yyy/

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
SMARTOFFICE_CHAT_MAX_TOKENS=4000

# Email Notifications
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=re_xxx
SMTP_FROM=notifications@valorfs.app
```

### Services

1. **Vercel**
   - Wildcard DNS: `*.valorfs.app` → Vercel project
   - Environment variables set in dashboard
   - Edge Functions for middleware

2. **Supabase**
   - PostgreSQL database with RLS enabled
   - Storage bucket: `smartoffice-reports` (private)
   - Webhooks: `INSERT` on storage bucket → `/api/smartoffice/webhook`

3. **Zapier**
   - Trigger: New email in Gmail (filter by to: `*@reports.valorfs.app`)
   - Action 1: Extract attachment
   - Action 2: Upload to Supabase Storage
   - Action 3: Parse email recipient → set tenant metadata

4. **Anthropic**
   - API key from console.anthropic.com
   - Claude 3.5 Sonnet model access

### CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):
```yaml
- Run type checks
- Run Vitest unit tests
- Run Playwright E2E tests (multi-tenant scenarios)
- Build Next.js
- Deploy to Vercel preview on PR
- Deploy to production on merge to main
```

### Hosting

- **Vercel** (recommended): Automatic deployments, edge middleware, wildcard domains
- **Alternative**: Railway, Render (requires wildcard DNS setup)

### Domains

1. Purchase `valorfs.app` (if not owned)
2. Add DNS records:
   - `A` record: `valorfs.app` → Vercel IP
   - `CNAME` record: `*.valorfs.app` → cname.vercel-dns.com
   - `MX` record: `reports.valorfs.app` → Gmail/Google Workspace

---

## Gate 5: Launch Checklist

### Security
- [ ] RLS enabled on all tables
- [ ] Tenant isolation tests pass (100% success)
- [ ] SQL injection prevention (parameterized queries only)
- [ ] Rate limiting on API routes (100 req/min per tenant)
- [ ] Webhook signature validation
- [ ] Environment secrets not committed to git
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS properly configured

### Performance
- [ ] Lighthouse score >90 (desktop & mobile)
- [ ] Database indexes on foreign keys
- [ ] Query performance <500ms for common operations
- [ ] Image optimization (Next.js Image component)
- [ ] Code splitting (dynamic imports for large components)

### Accessibility
- [ ] WCAG AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast ratios pass
- [ ] Focus indicators visible

### SEO
- [ ] Meta tags on public pages
- [ ] Sitemap.xml generated
- [ ] robots.txt configured
- [ ] Open Graph images

### Error Handling
- [ ] 404 page styled
- [ ] 500 page styled
- [ ] Error boundaries in React
- [ ] User-friendly error messages
- [ ] Sentry integration for error tracking (optional)

### Onboarding
- [ ] Welcome email sent on signup
- [ ] SmartOffice setup instructions clear
- [ ] Zapier configuration guide
- [ ] First-sync success notification
- [ ] Empty state messaging

### Communication
- [ ] Transactional emails styled (branded)
- [ ] Sync failure alerts
- [ ] Weekly summary emails (optional)

### Data Management
- [ ] Export user data (GDPR compliance)
- [ ] Delete tenant data (GDPR right to deletion)
- [ ] Backup strategy (Supabase automatic backups)

### Mobile
- [ ] Responsive on 320px+ screens
- [ ] Touch targets 44px minimum
- [ ] No horizontal scroll
- [ ] PWA manifest configured (optional)

---

## Appendix: Risk Mitigation

### Risk 1: Zapier Reliability
**Impact**: High | **Likelihood**: Medium
**Mitigation**:
- Monitor Zapier task history daily
- Set up alerts for failed tasks
- Build fallback: manual file upload UI
- Consider webhook retry logic

### Risk 2: Excel File Format Changes
**Impact**: High | **Likelihood**: Low
**Mitigation**:
- Schema validator detects column changes
- Alert user immediately on mismatch
- Support multiple schema versions
- Provide mapping UI to adjust columns

### Risk 3: AI Query Safety
**Impact**: High | **Likelihood**: Low
**Mitigation**:
- Whitelist allowed SQL operations (SELECT only)
- Enforce tenantId in generated queries
- Timeout queries at 10 seconds
- Log all AI-generated SQL for audit

### Risk 4: Subdomain DNS Propagation
**Impact**: Medium | **Likelihood**: Low
**Mitigation**:
- Document DNS setup clearly
- Provide test subdomain for verification
- Support custom domains (advanced)

### Risk 5: Database Migration Downtime
**Impact**: High | **Likelihood**: Medium
**Mitigation**:
- Run migrations during low-traffic window
- Use Prisma's safe migration preview
- Backup database before migration
- Test migrations in staging environment

---

**Last Updated**: 2026-02-27
**Status**: Ready for Stage 3 (Prompt Generation)
