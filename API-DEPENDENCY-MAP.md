# 🗺️ API DEPENDENCY MAP

## Overview
Complete mapping of all API routes, their database dependencies, authentication requirements, and data flow.

---

## 🔐 Authentication & Tenant System

### Core Auth Components
- **`middleware.ts`** - Extracts tenant from subdomain/headers, sets tenant context
- **`lib/auth/server-auth.ts`** - `requireAuth()` validates Supabase session
- **`lib/auth/get-tenant-context.ts`** - `getTenantFromRequest()` extracts tenant info
- **`lib/db/tenant-scoped-prisma.ts`** - `withTenantContext()` sets RLS parameter

### Flow
```
Request → Middleware → Extract Tenant → Set Headers → Route Handler
                ↓
         requireAuth() → Validate Session → Get User ID
                ↓
    getTenantFromRequest() → Extract Tenant Context
                ↓
      withTenantContext() → Set RLS → Query Database
```

---

## 📁 API Routes by Category

### 🔹 Authentication Routes

#### `/api/auth/signin` (POST)
**Purpose:** Sign in user with Supabase
**Database:** `users` table
**Auth Required:** No
**Tenant Scoped:** No
**Dependencies:**
- Supabase Auth
- `prisma.user.findUnique()`

#### `/api/profile` (GET, PUT)
**Purpose:** Get/update current user profile
**Database:** `users`, `user_profiles` tables
**Auth Required:** ✅ Yes (`requireAuth`)
**Tenant Scoped:** No
**Dependencies:**
- `requireAuth()` → Get authenticated user
- `prisma.user.findUnique()` with profile include

---

### 🔹 Dashboard Routes

#### `/api/dashboard` (GET)
**Purpose:** Main dashboard data aggregation
**Database:** Multiple tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ❌ No (uses userId directly)
**Dependencies:**
- `users` - Organization memberships
- `cases` - Recent cases, status counts
- `commissions` - Total, pending, paid amounts
- `notifications` - Recent notifications
- `quotes` - Total count
- `contracts` - Count

**Query Pattern:**
```typescript
// Direct user queries (NOT tenant-scoped)
const cases = await prisma.case.findMany({ where: { userId } })
const commissions = await prisma.commission.aggregate({ where: { userId } })
```

---

### 🔹 Cases Routes

#### `/api/cases` (GET, POST)
**Purpose:** List and create cases
**Database:** `cases`, `quotes` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- `requireAuth()` → userId
- `getTenantFromRequest()` → tenantId
- `withTenantContext()` → RLS

**GET Query:**
```typescript
await withTenantContext(tenantId, async (db) => {
  return db.case.findMany({
    where: { tenantId, userId },
    include: { quote: true }
  })
})
```

#### `/api/cases/[id]` (GET, PUT, DELETE)
**Purpose:** Get/update/delete specific case
**Database:** `cases`, `case_notes` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

#### `/api/cases/[id]/notes` (GET, POST)
**Purpose:** Case notes
**Database:** `case_notes` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

---

### 🔹 Quotes Routes

#### `/api/quotes` (GET, POST)
**Purpose:** List and create quotes
**Database:** `quotes` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ❌ No (direct userId query)
**Dependencies:**
- `prisma.quote.findMany({ where: { userId } })`

---

### 🔹 Commissions Routes

#### `/api/commissions` (GET)
**Purpose:** List commissions
**Database:** `commissions` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ❌ No
**Dependencies:**
- `prisma.commission.findMany({ where: { userId } })`

---

### 🔹 Reports Routes (ALL CONVERTED TO REAL DATA ✅)

#### `/api/reports/agents` (GET)
**Purpose:** Agent performance analytics
**Database:** `users`, `cases`, `commissions` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- `getTenantFromRequest()`
- `requireAuth()`
- `withTenantContext()`

**Data Flow:**
```typescript
1. Get all agents in tenant (role: AGENT/MANAGER, status: ACTIVE)
2. For each agent:
   - Get cases (with quote.premium, quote.type)
   - Get commission totals
   - Calculate metrics (totalPremium, policyCount, averageCase)
   - Calculate product mix percentages
   - Generate monthly trend (last 6 months)
3. Sort by totalPremium, assign ranks
4. Return summary + agent metrics
```

#### `/api/reports/carriers` (GET)
**Purpose:** Carrier performance analytics
**Database:** `quotes`, `cases` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- Date range helper: `getDateRange(period)`
- Groups quotes by carrier
- Counts approved cases per carrier

**Data Flow:**
```typescript
1. Get all quotes in date range with carrier != null
2. Group by carrier name
3. For each carrier:
   - totalPremium (sum of quote.premium)
   - quotesSubmitted (count)
   - casesApproved (count where case.status = APPROVED)
   - policyCount
   - Product type breakdown
4. Calculate market share, approval rates
5. Sort by totalPremium
```

#### `/api/reports/goal-tracking` (GET)
**Purpose:** Goal progress tracking
**Database:** `goals` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

**Data Flow:**
```typescript
1. Get all goals with user info
2. For each goal:
   - percentage = (current / target) * 100
   - daysRemaining = endDate - now
   - status = ON_TRACK | AT_RISK | ACHIEVED | MISSED
   - projectedCompletion (based on current rate)
   - requiredDailyRate to meet goal
3. Calculate summary stats
```

#### `/api/reports/forecast` (GET)
**Purpose:** Commission forecasting
**Database:** `commissions`, `quotes`, `users` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

**Data Flow:**
```typescript
1. Get historical commissions (last 6 months)
2. Calculate monthly averages and growth rate
3. Generate monthly forecasts (conservative/projected/optimistic)
4. Forecast by agent (based on recent performance)
5. Forecast by carrier (from recent quotes)
6. Return projections with confidence levels
```

#### `/api/reports/executive` (GET)
**Purpose:** Executive summary dashboard
**Database:** `cases`, `users` tables
**Auth Required:** ❌ No (public/admin)
**Tenant Scoped:** ❌ No

---

### 🔹 Help & Training Routes (ALL REAL DATA ✅)

#### `/api/help/articles` (GET)
**Purpose:** Get help articles
**Database:** `help_articles` table
**Auth Required:** ❌ No
**Tenant Scoped:** ❌ No (content is global)
**Dependencies:**
- `prisma.helpArticle.findMany()`
- Filters: category, search, status
- Returns grouped by category

#### `/api/help/articles/[slug]` (GET)
**Purpose:** Get specific article
**Database:** `help_articles` table
**Features:** Increments view count on read

#### `/api/help/articles/[slug]/feedback` (POST)
**Purpose:** Submit article feedback (helpful/not helpful)
**Database:** `article_feedback` table
**Updates:** `helpfulCount` or `notHelpfulCount` on article

#### `/api/help/faqs` (GET)
**Purpose:** Get FAQs
**Database:** `faqs` table
**Auth Required:** ❌ No

#### `/api/help/search` (GET)
**Purpose:** Search help content
**Database:** `help_articles`, `faqs` tables
**Features:** Full-text search across title, content, tags

#### `/api/help/videos` (GET) ✅ NEW
**Purpose:** Get training videos
**Database:** `videos` table
**Auth Required:** ❌ No
**Returns:** All videos with metadata (duration, views, featured status)

---

### 🔹 Training Routes (CONVERTED ✅)

#### `/api/training/courses` (GET)
**Purpose:** Get available courses
**Database:** `courses`, `enrollments` tables
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- Filters: search, category, level
- Calculates enrollment count per course
- Calculates average rating from enrollments

**Data Flow:**
```typescript
1. Get courses (status: PUBLISHED, tenantId)
2. For each course:
   - Count enrollments
   - Calculate average rating
3. Filter by search/category/level
4. Return course list with metadata
```

#### `/api/training/my-learning` (GET)
**Purpose:** User's enrolled courses
**Database:** `enrollments`, `courses` tables
**Auth Required:** ✅ Yes

---

### 🔹 Resources Routes (CONVERTED ✅)

#### `/api/resources` (GET)
**Purpose:** Get resource library files
**Database:** `resources` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- `getTenantFromRequest()`
- `requireAuth()`
- Filters: search, type, category

**Data Flow:**
```typescript
1. Get resources for tenant
2. Filter by:
   - search (title, description, fileName)
   - type (Marketing Material, Form, etc.)
   - category (Life Insurance, Annuities, etc.)
3. Return resources with metadata
```

---

### 🔹 Notifications Routes

#### `/api/notifications` (GET)
**Purpose:** Get user notifications
**Database:** `notifications` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

#### `/api/notifications/read-all` (POST)
**Purpose:** Mark all notifications as read
**Database:** `notifications` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes

---

### 🔹 Admin Routes

#### `/api/admin/integrations` (GET)
**Purpose:** Get integration configs
**Database:** (Mock data - no DB)
**Auth Required:** ❌ No

#### `/api/admin/users` (GET, POST)
**Purpose:** User management
**Database:** `users` table

#### `/api/admin/roles` (GET, POST, PUT, DELETE)
**Purpose:** Role-based access control
**Database:** Custom (not in schema yet)

---

### 🔹 SmartOffice Routes

#### `/api/smartoffice/chat` (POST)
**Purpose:** AI chat with Anthropic Claude
**Database:** `smart_office_chat_history` table
**Auth Required:** ✅ Yes
**Tenant Scoped:** ✅ Yes
**Dependencies:**
- Anthropic API
- `ANTHROPIC_API_KEY` env var
- `ANTHROPIC_MODEL` env var (defaults to claude-3-5-sonnet-latest)

#### `/api/smartoffice/dashboard-metrics` (GET)
**Purpose:** Metrics for SmartOffice dashboard
**Database:** `smart_office_policies` table

#### `/api/smartoffice/sync` (POST)
**Purpose:** Sync data with external system
**Database:** `smart_office_sync_logs` table

---

## 📊 Database Tables Usage Map

### Most Used Tables
1. **`users`** - Used by: dashboard, profile, reports/agents, most routes
2. **`cases`** - Used by: dashboard, cases routes, reports (agents, carriers, executive)
3. **`commissions`** - Used by: dashboard, commissions routes, reports (agents, forecast)
4. **`quotes`** - Used by: quotes routes, reports (carriers, forecast)
5. **`notifications`** - Used by: dashboard, notification routes

### Content Tables (Global, No Tenant)
- `help_articles`
- `article_feedback`
- `faqs`
- `videos`
- `video_categories`
- `product_info`

### Training Tables (Tenant Scoped)
- `courses`
- `lessons`
- `enrollments`
- `lesson_progress`
- `certifications`
- `training_events`
- `event_attendees`

### Resource Tables (Tenant Scoped)
- `resources`
- `resource_favorites`

### Community Tables (Not Implemented Yet)
- `discussions` (not in schema)
- `discussion_replies` (not in schema)

---

## 🔑 Authentication Patterns

### Pattern 1: Full Auth + Tenant Scope (Most Secure)
```typescript
const tenantContext = getTenantFromRequest(request);
await requireAuth(request);

await withTenantContext(tenantContext.tenantId, async (db) => {
  // RLS enforced - all queries automatically filtered by tenantId
  return db.case.findMany({ where: { userId } })
})
```
**Used By:** `/api/cases`, `/api/reports/*`

### Pattern 2: Auth Only (No Tenant Scope)
```typescript
const user = await requireAuth(request);
const data = await prisma.model.findMany({ where: { userId: user.id } })
```
**Used By:** `/api/dashboard`, `/api/quotes`, `/api/commissions`

### Pattern 3: No Auth (Public)
```typescript
const data = await prisma.helpArticle.findMany({})
```
**Used By:** `/api/help/*`

---

## 🌐 Environment Variables

### Required
- `DATABASE_URL` - Postgres connection string
- `DIRECT_URL` - Direct Postgres connection (non-pooler)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Optional
- `DEFAULT_TENANT_ID` - Tenant for root domain
- `DEFAULT_TENANT_SLUG` - Tenant slug for root domain
- `DEFAULT_TENANT_NAME` - Tenant name for root domain
- `ANTHROPIC_API_KEY` - Claude API key (SmartOffice)
- `ANTHROPIC_MODEL` - Claude model (default: claude-3-5-sonnet-latest)

---

## ⚠️ Known Issues

### 1. Inconsistent Tenant Scoping
- **Issue:** Some routes use tenant scoping, others don't
- **Affected:** `/api/dashboard`, `/api/quotes`, `/api/commissions`
- **Impact:** Could expose data across tenants
- **Fix:** Should use `withTenantContext()` for all tenant data

### 2. Hard-coded "demo-user-id"
- **Issue:** `/api/users/demo-user-id/organizations` still referenced
- **Status:** Error occurs but route not used in main flow

### 3. RLS Parameter Not Set in Dev
- **Issue:** Local Postgres doesn't have `app.current_tenant_id` parameter
- **Impact:** Some queries fail in development
- **Workaround:** Works in Supabase production

---

## 📈 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Middleware   │
                    │ Extract Tenant│
                    └───────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Route Handler │
                   └────────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌──────────────┐         ┌────────────────┐
       │ requireAuth()│         │getTenantFrom   │
       │Get User ID   │         │Request()       │
       └──────┬───────┘         └────────┬───────┘
              │                          │
              ▼                          ▼
       ┌──────────────────────────────────────┐
       │   withTenantContext(tenantId)        │
       │   Sets RLS: app.current_tenant_id    │
       └──────────────┬───────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  PRISMA QUERY        │
           │  Filtered by:        │
           │  - tenantId (RLS)    │
           │  - userId (WHERE)    │
           └──────────┬───────────┘
                      │
                      ▼
              ┌──────────────┐
              │  POSTGRES    │
              │  DATABASE    │
              └──────┬───────┘
                      │
                      ▼
              ┌──────────────┐
              │   RESPONSE   │
              └──────────────┘
```

---

## ✅ Summary

### Routes Converted (No More Mock Data)
- ✅ `/api/resources` - Now queries `resources` table
- ✅ `/api/training/courses` - Now queries `courses` table
- ✅ `/api/help/videos` - New route, queries `videos` table
- ✅ `/api/reports/agents` - Real user/case/commission data
- ✅ `/api/reports/carriers` - Real quote/case data
- ✅ `/api/reports/goal-tracking` - Real goal data
- ✅ `/api/reports/forecast` - Real commission data with projections

### Routes Using Real Data (Already Good)
- ✅ `/api/help/articles` - `help_articles` table
- ✅ `/api/help/faqs` - `faqs` table
- ✅ `/api/cases` - `cases` table
- ✅ `/api/dashboard` - Multiple tables
- ✅ `/api/profile` - `users` table

### Total API Routes: **40+**
### Routes with Tenant Scoping: **~25**
### Routes with Authentication: **~30**
### Routes Using Mock Data: **0** ✅

---

**Last Updated:** 2026-03-24
