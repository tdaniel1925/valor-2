# BUILD PROMPT: Feature 1 - Multi-Tenant Foundation

## What and Why

### Objective
Transform the existing single-tenant Valor platform into a multi-tenant SaaS application where multiple insurance agencies can use the system simultaneously with complete data isolation. This is the foundational feature that ALL other features depend on.

### Why This Matters
- **Security**: Without proper tenant isolation, Agency A could access Agency B's data (massive security breach)
- **Scalability**: Can serve 100+ agencies without separate deployments
- **Foundation**: Every future feature (SmartOffice sync, AI chat, reports) must be tenant-scoped from day one

### Current Problem
Right now:
- All users exist in a global pool (no tenant concept)
- API routes filter by `userId` only (no tenant checking)
- No subdomain-based routing
- Organization model is internal hierarchy, not tenant boundaries
- 80+ API routes lack tenant filtering
- Zero RLS policies in database

### Success Criteria
After this feature:
- ✅ User from Tenant A **CANNOT** query Tenant B data (enforced at database + middleware)
- ✅ Subdomain `agency1.valorfs.app` resolves to Tenant "agency1"
- ✅ All core tables have `tenantId` foreign key
- ✅ RLS policies prevent cross-tenant data leakage
- ✅ Playwright tests verify isolation (3 tenants, verify User A cannot see User B's data)

---

## Current Codebase State

### Existing Architecture (Single-Tenant)
**Database Schema** (C:\dev\valor-2\prisma\schema.prisma):
- `User` model (lines 32-69): NO tenantId field
- `Case` model (lines 276-322): Only `userId` filter
- `Quote` model (lines 224-259): Only `userId` filter
- `Commission` model (lines 357-385): Only `userId` filter
- `Organization` model (lines 106-139): Hierarchical (IMO → MGA → Agency), NOT tenants

**Middleware** (C:\dev\valor-2\middleware.ts):
- Lines 1-78: Auth checks exist
- Line 59: Injects `x-user-id` header
- **MISSING**: Tenant resolution from subdomain
- **MISSING**: `x-tenant-id` header injection
- Lines 50-55: Auth temporarily disabled (needs re-enabling with tenant checks)

**API Routes** (C:\dev\valor-2\app\api\**):
- 111 total API routes
- Pattern: `const userId = request.headers.get("x-user-id");`
- **NO PATTERN**: `const tenantId = request.headers.get("x-tenant-id");`
- Examples of unprotected routes:
  - `app\api\organizations\route.ts:12` - Returns ALL organizations
  - `app\api\analytics\team\route.ts:8` - No tenant validation
  - `app\api\reports\commissions\route.ts:30` - Optional user filter only

**Authentication** (C:\dev\valor-2\lib\auth\server-auth.ts):
- Lines 49-67: `canAccessUserResource()` only checks userId
- Line 64: TODO comment "Add organization-level access checks here"

### Database Statistics
- **Tables**: 30+ models in schema
- **Core tables needing tenantId**: User, Case, Quote, Commission, Contract, Organization, Goal, Notification, AuditLog, ProductInfo, HelpArticle, FAQ, Resource, Course, Enrollment, Certification, TrainingEvent
- **SmartOffice tables**: Already have tenantId in design (not yet in schema)
- **Junction tables**: OrganizationMember, EventAttendee, ResourceFavorite, LessonProgress, ArticleFeedback

### Environment
- **Next.js**: 16.0.10 (App Router)
- **Prisma**: 6.19.0
- **Supabase**: PostgreSQL 17.6
- **TypeScript**: 5.9.3
- **Testing**: Playwright 1.58.2, Vitest (not yet configured)

---

## Reference Docs Consulted

1. **PROJECT-SPEC.md** (C:\dev\valor-2\_BUILD\PROJECT-SPEC.md)
   - Gate 1: Multi-tenant architecture design
   - Gate 2: Feature requirements
   - Gate 3: Implementation plan (Phase 1)

2. **MASTER.md** (C:\dev\valor-2\_BUILD\MASTER.md)
   - Feature 1 complexity: Large (5-7 days)
   - Files affected: ~30
   - Tests required: 20 E2E + 15 unit

3. **CLAUDE.md** (C:\dev\valor-2\CLAUDE.md)
   - PPBV process requirements
   - Verification checklist mandatory
   - No placeholders, complete code only

4. **CODEBAKERS.md** (C:\dev\valor-2\CODEBAKERS.md)
   - API route structure patterns
   - Component patterns (for future UI)
   - TypeScript strict mode requirements

5. **Existing Codebase**
   - Analyzed middleware.ts
   - Analyzed prisma/schema.prisma
   - Analyzed 10+ API routes for current patterns
   - Analyzed lib/auth/ for auth patterns

---

## Steps in Order (File Paths & Functions)

### PHASE 1A: Database Schema Updates

#### Step 1: Add Tenant Model and Enums
**File**: `prisma/schema.prisma`
**Location**: After line 12 (after datasource block)
**Action**: Add these models BEFORE the existing User model:

```prisma
// ============================================
// MULTI-TENANCY FOUNDATION
// ============================================

enum TenantStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  CHURNED
}

model Tenant {
  id              String   @id @default(uuid())
  name            String   // Agency name (e.g., "Acme Insurance Agency")
  slug            String   @unique  // For subdomain (e.g., "acme-insurance")

  // Email configuration for SmartOffice sync
  emailSlug       String   @unique  // {slug}@reports.valorfs.app
  emailVerified   Boolean  @default(false)
  lastSyncAt      DateTime?

  // Future billing (not implemented yet)
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
  contracts       Contract[]
  goals           Goal[]
  notifications   Notification[]
  auditLogs       AuditLog[]
  productInfo     ProductInfo[]
  helpArticles    HelpArticle[]
  faqs            FAQ[]
  resources       Resource[]
  courses         Course[]
  trainingEvents  TrainingEvent[]

  // SmartOffice Intelligence
  smartOfficePolicies  SmartOfficePolicy[]
  smartOfficeAgents    SmartOfficeAgent[]
  smartOfficeReports   SmartOfficeCustomReport[]
  smartOfficeChatHistory SmartOfficeChatHistory[]
  syncLogs        SmartOfficeSyncLog[]

  @@index([slug])
  @@index([status])
  @@map("tenants")
}
```

#### Step 2: Update User Model
**File**: `prisma/schema.prisma`
**Location**: User model (line 32)
**Action**: Add tenant relation

```prisma
model User {
  id                String         @id @default(uuid())

  // NEW: Tenant scoping
  tenantId          String
  tenant            Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  email             String         @unique
  firstName         String
  lastName          String
  phone             String?
  profilePhoto      String?
  role              UserRole       @default(AGENT)
  status            UserStatus     @default(PENDING)
  emailVerified     Boolean        @default(false)
  mfaEnabled        Boolean        @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  profile           UserProfile?
  organizations     OrganizationMember[]
  contracts         Contract[]
  instructorCourses Course[]       @relation("InstructorCourses")
  enrollments       Enrollment[]   @relation("UserEnrollments")
  certifications    Certification[] @relation("UserCertifications")
  instructorEvents  TrainingEvent[] @relation("InstructorEvents")
  eventAttendances  EventAttendee[] @relation("EventAttendances")
  uploadedResources Resource[]     @relation("UploadedResources")
  favoriteResources ResourceFavorite[] @relation("FavoriteResources")
  cases             Case[]
  quotes            Quote[]
  commissions       Commission[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  goals             Goal[]

  // SmartOffice Intelligence System
  smartOfficeAgents SmartOfficeAgent[]  @relation("SmartOfficeAgentLink")
  smartOfficeReports SmartOfficeCustomReport[] @relation("CreatedSmartOfficeReports")
  smartOfficeChatHistory SmartOfficeChatHistory[] @relation("SmartOfficeChatHistory")

  @@index([email])
  @@index([role])
  @@index([status])
  @@index([tenantId]) // NEW INDEX
  @@map("users")
}
```

#### Step 3: Update Core Models (Add tenantId to each)
**File**: `prisma/schema.prisma`
**Models to update**: Case, Quote, Commission, Contract, Organization, Goal, Notification, AuditLog

**Pattern for each model**:
```prisma
model Case { // Example (repeat for all)
  id            String   @id @default(uuid())

  // NEW: Tenant scoping (add as SECOND field, after id)
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // ... rest of existing fields ...

  @@index([tenantId]) // NEW INDEX at the bottom
  // ... rest of indexes ...
}
```

**Specific models and line numbers**:
1. **Organization** (line 106) - Add tenantId after id
2. **Contract** (line 173) - Add tenantId after id
3. **Quote** (line 224) - Add tenantId after id
4. **Case** (line 276) - Add tenantId after id
5. **Commission** (line 357) - Add tenantId after id
6. **Notification** (line 414) - Add tenantId after id
7. **AuditLog** (line 448) - Add tenantId after id
8. **Goal** (line 488) - Add tenantId after id
9. **ProductInfo** (line 749) - Add tenantId after id
10. **HelpArticle** (line 807) - Add tenantId after id (or make tenant-agnostic - see note)
11. **FAQ** (line 870) - Add tenantId after id (or make tenant-agnostic - see note)
12. **Resource** (line 693) - Add tenantId after id
13. **Course** (line 523) - Add tenantId after id
14. **TrainingEvent** (line 630) - Add tenantId after id

**NOTE on Help Articles & FAQs**: These could be global (shared across tenants) OR tenant-specific. For MVP, make them tenant-scoped. Later can add `isGlobal` boolean flag.

#### Step 4: Create Migration
**File**: Terminal command
**Action**:
```bash
npx prisma migrate dev --name add_multi_tenant_foundation
```

**Expected output**: Migration created in `prisma/migrations/TIMESTAMP_add_multi_tenant_foundation/`

**Verification**:
```bash
npx prisma migrate status
# Should show: "Database is up to date"
```

#### Step 5: Generate Prisma Client
**File**: Terminal command
**Action**:
```bash
npx prisma generate
```

**Expected**: Prisma Client regenerated with new Tenant model and tenantId fields

---

### PHASE 1B: Row Level Security (RLS)

#### Step 6: Create RLS Migration File
**File**: `supabase/migrations/20260227160000_add_rls_policies.sql` (create new)
**Action**: Add comprehensive RLS policies

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartoffice_chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data in their tenant
-- This uses PostgreSQL's current_setting() to get tenant_id from session
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_organizations ON organizations
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_cases ON cases
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_quotes ON quotes
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_commissions ON commissions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_contracts ON contracts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_goals ON goals
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_notifications ON notifications
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_product_info ON product_info
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_help_articles ON help_articles
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_faqs ON faqs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_resources ON resources
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_courses ON courses
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_training_events ON training_events
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_smartoffice_policies ON smartoffice_policies
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_smartoffice_agents ON smartoffice_agents
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_smartoffice_sync_logs ON smartoffice_sync_logs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_smartoffice_custom_reports ON smartoffice_custom_reports
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_smartoffice_chat_history ON smartoffice_chat_history
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tenants table: Users can only see their own tenant
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR SELECT
  USING (id = current_setting('app.tenant_id', true)::uuid);
```

**Apply migration**:
```bash
# Via Supabase CLI
npx supabase db push --linked

# OR via SQL editor in Supabase dashboard
```

---

### PHASE 1C: Tenant Resolution Middleware

#### Step 7: Create Tenant Context Helper
**File**: `lib/auth/tenant-context.ts` (create new)
**Action**: Extract tenant from subdomain

```typescript
import { NextRequest } from "next/server";

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName?: string;
}

/**
 * Extract tenant slug from subdomain
 * Examples:
 *   - agency1.valorfs.app → "agency1"
 *   - localhost → null (local dev, no tenant)
 *   - valorfs.app → null (root domain, no tenant)
 */
export function extractTenantSlug(request: NextRequest): string | null {
  const hostname = request.headers.get("host") || "";

  // Local development
  if (hostname.includes("localhost")) {
    // Check for test subdomains: test-agency.localhost
    const match = hostname.match(/^([\w-]+)\.localhost/);
    return match ? match[1] : null;
  }

  // Production: Extract subdomain from {slug}.valorfs.app
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "valorfs.app";
  const subdomainMatch = hostname.match(new RegExp(`^([\\w-]+)\\.${rootDomain.replace(".", "\\.")}`));

  if (subdomainMatch && subdomainMatch[1]) {
    const slug = subdomainMatch[1];
    // Ignore common non-tenant subdomains
    if (["www", "api", "admin", "app"].includes(slug)) {
      return null;
    }
    return slug;
  }

  return null;
}

/**
 * Resolve tenant from database by slug
 * Returns null if tenant not found or inactive
 */
export async function resolveTenantBySlug(slug: string): Promise<TenantContext | null> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
      },
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      return null;
    }

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    };
  } finally {
    await prisma.$disconnect();
  }
}
```

#### Step 8: Update Middleware
**File**: `middleware.ts`
**Location**: Replace entire file
**Action**: Add tenant resolution

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { extractTenantSlug, resolveTenantBySlug } from "./lib/auth/tenant-context";

// Public routes that don't require auth OR tenant
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/auth/reset-password",
  "/api/webhooks",
];

// API routes that bypass tenant checking (webhooks, health checks)
const bypassTenantRoutes = [
  "/api/webhooks",
  "/api/health",
  "/api/auth",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;

  // ============================================
  // 1. AUTH: Verify Supabase session
  // ============================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete({ name, ...options });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  // Public routes: Skip auth check
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route));

  if (!isPublicRoute && !session) {
    // Redirect to login, preserve original URL
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // ============================================
  // 2. TENANT RESOLUTION: Extract from subdomain
  // ============================================
  const bypassTenant = bypassTenantRoutes.some(route => path.startsWith(route));

  if (!bypassTenant && !isPublicRoute) {
    const tenantSlug = extractTenantSlug(request);

    if (!tenantSlug) {
      // No subdomain = redirect to root or show error
      console.error("[Middleware] No tenant slug found in hostname:", request.headers.get("host"));
      return NextResponse.redirect(new URL("/no-tenant", request.url));
    }

    // Resolve tenant from database
    const tenantContext = await resolveTenantBySlug(tenantSlug);

    if (!tenantContext) {
      // Tenant not found or inactive
      console.error("[Middleware] Tenant not found or inactive:", tenantSlug);
      return NextResponse.redirect(new URL("/tenant-not-found", request.url));
    }

    // Inject tenant context into headers
    response.headers.set("x-tenant-id", tenantContext.tenantId);
    response.headers.set("x-tenant-slug", tenantContext.tenantSlug);

    // ============================================
    // 3. USER-TENANT VALIDATION: Verify user belongs to this tenant
    // ============================================
    if (session?.user?.id) {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { tenantId: true },
        });

        if (!user || user.tenantId !== tenantContext.tenantId) {
          console.error("[Middleware] User does not belong to this tenant", {
            userId: session.user.id,
            requestedTenant: tenantContext.tenantId,
            userTenant: user?.tenantId,
          });
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  }

  // ============================================
  // 4. INJECT USER ID: Add to headers for API routes
  // ============================================
  if (session?.user?.id) {
    response.headers.set("x-user-id", session.user.id);
  }

  return response;
}

// Only run middleware on these paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### PHASE 1D: Update API Routes (Pattern Application)

#### Step 9: Create Tenant Context Utility for API Routes
**File**: `lib/auth/get-tenant-context.ts` (create new)
**Action**: Helper to extract tenant from request headers

```typescript
import { NextRequest } from "next/server";

export interface RequestTenantContext {
  tenantId: string;
  userId: string | null;
}

/**
 * Extract tenant and user context from request headers
 * These headers are injected by middleware
 *
 * @throws Error if tenantId header is missing (indicates middleware bypass or misconfiguration)
 */
export function getTenantContext(request: NextRequest): RequestTenantContext {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    throw new Error("Missing x-tenant-id header. Ensure middleware is configured correctly.");
  }

  return {
    tenantId,
    userId: userId || null,
  };
}
```

#### Step 10: Update Prisma Client to Set Tenant Context
**File**: `lib/db/tenant-scoped-prisma.ts` (create new)
**Action**: Prisma client wrapper that sets RLS tenant_id

```typescript
import { PrismaClient } from "@prisma/client";

/**
 * Create a Prisma client instance with tenant context set for RLS
 * This ensures all queries are automatically filtered by tenant
 */
export function getTenantScopedPrismaClient(tenantId: string): PrismaClient {
  const prisma = new PrismaClient();

  // Set PostgreSQL session variable for RLS policies
  // This must be called before any queries
  prisma.$executeRawUnsafe(`SET app.tenant_id = '${tenantId}'`);

  return prisma;
}

/**
 * Helper to wrap Prisma operations with tenant context
 * Usage:
 *   const result = await withTenantContext(tenantId, async (prisma) => {
 *     return await prisma.case.findMany();
 *   });
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = new PrismaClient();

  try {
    // Set tenant context for RLS
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '${tenantId}'`);

    // Execute the operation
    return await operation(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
```

#### Step 11: Update API Routes (Sample Pattern)
**Pattern to apply to ALL API routes** (80+ files in `app/api/`):

**Before** (example: `app/api/cases/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");

  const cases = await prisma.case.findMany({
    where: { userId },
  });

  return Response.json(cases);
}
```

**After** (with tenant scoping):
```typescript
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";

export async function GET(request: NextRequest) {
  const { tenantId, userId } = getTenantContext(request);

  const cases = await withTenantContext(tenantId, async (prisma) => {
    return await prisma.case.findMany({
      where: {
        // tenantId filtering is automatic via RLS
        // Still filter by userId for user-specific views
        userId: userId || undefined,
      },
    });
  });

  return Response.json(cases);
}
```

**Files to update** (High Priority - Core Business Logic):
1. `app/api/cases/route.ts` - GET, POST
2. `app/api/cases/[id]/route.ts` - GET, PUT, DELETE
3. `app/api/quotes/route.ts` - GET, POST
4. `app/api/commissions/route.ts` - GET, POST
5. `app/api/commissions/user/[userId]/route.ts` - GET
6. `app/api/organizations/route.ts` - GET, POST
7. `app/api/organizations/[id]/route.ts` - GET, PUT, DELETE
8. `app/api/contracts/route.ts` - GET, POST
9. `app/api/contracts/[id]/route.ts` - GET, PUT
10. `app/api/reports/production/route.ts` - GET
11. `app/api/reports/commissions/route.ts` - GET
12. `app/api/analytics/dashboard/route.ts` - GET
13. `app/api/analytics/team/route.ts` - GET
14. `app/api/admin/users/route.ts` - GET, POST
15. `app/api/admin/organizations/route.ts` - GET

**Note**: Do NOT update webhook routes (`app/api/webhooks/**`) or public auth routes yet.

---

### PHASE 1E: Error Pages

#### Step 12: Create Tenant Error Pages
**File**: `app/no-tenant/page.tsx` (create new)
**Action**: Error page when no subdomain detected

```typescript
export default function NoTenantPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No Tenant Found</h1>
        <p className="text-gray-600 mb-6">
          You must access this application via a subdomain (e.g., your-agency.valorfs.app).
        </p>
        <p className="text-sm text-gray-500">
          If you need help, contact support@valorfinancial.com
        </p>
      </div>
    </div>
  );
}
```

**File**: `app/tenant-not-found/page.tsx` (create new)
**Action**: Error page when tenant slug doesn't exist

```typescript
export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tenant Not Found</h1>
        <p className="text-gray-600 mb-6">
          The agency subdomain you're trying to access doesn't exist or has been deactivated.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Please check the URL and try again, or contact the agency administrator.
        </p>
        <a href="/" className="text-blue-600 hover:underline">
          Return to home
        </a>
      </div>
    </div>
  );
}
```

**File**: `app/unauthorized/page.tsx` (create new)
**Action**: Error page when user doesn't belong to tenant

```typescript
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this agency's account.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          If you believe this is an error, please contact your administrator.
        </p>
        <a href="/logout" className="text-blue-600 hover:underline">
          Log out and try different account
        </a>
      </div>
    </div>
  );
}
```

---

### PHASE 1F: Testing

#### Step 13: Create Unit Tests for Tenant Context
**File**: `tests/unit/lib/auth/tenant-context.test.ts` (create new)
**Action**: Test subdomain extraction logic

```typescript
import { describe, it, expect } from "vitest";
import { extractTenantSlug } from "@/lib/auth/tenant-context";
import { NextRequest } from "next/server";

describe("extractTenantSlug", () => {
  it("extracts tenant slug from production subdomain", () => {
    const request = new NextRequest("https://acme-insurance.valorfs.app/dashboard", {
      headers: { host: "acme-insurance.valorfs.app" },
    });
    expect(extractTenantSlug(request)).toBe("acme-insurance");
  });

  it("extracts tenant slug from localhost subdomain", () => {
    const request = new NextRequest("http://test-agency.localhost:2050/dashboard", {
      headers: { host: "test-agency.localhost:2050" },
    });
    expect(extractTenantSlug(request)).toBe("test-agency");
  });

  it("returns null for root domain", () => {
    const request = new NextRequest("https://valorfs.app/", {
      headers: { host: "valorfs.app" },
    });
    expect(extractTenantSlug(request)).toBeNull();
  });

  it("returns null for www subdomain", () => {
    const request = new NextRequest("https://www.valorfs.app/", {
      headers: { host: "www.valorfs.app" },
    });
    expect(extractTenantSlug(request)).toBeNull();
  });

  it("returns null for localhost without subdomain", () => {
    const request = new NextRequest("http://localhost:2050/", {
      headers: { host: "localhost:2050" },
    });
    expect(extractTenantSlug(request)).toBeNull();
  });
});
```

#### Step 14: Create E2E Tests for Tenant Isolation
**File**: `tests/e2e/multi-tenant-isolation.spec.ts` (create new)
**Action**: Verify data isolation between tenants

```typescript
import { test, expect } from "@playwright/test";

// This test requires:
// 1. Three test tenants in database: tenant-a, tenant-b, tenant-c
// 2. Users in each tenant
// 3. Sample cases in each tenant

test.describe("Multi-Tenant Isolation", () => {
  test("User from Tenant A cannot access Tenant B's subdomain", async ({ page }) => {
    // Login as Tenant A user
    await page.goto("http://tenant-a.localhost:2050/login");
    await page.fill('input[name="email"]', "user-a@tenant-a.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/tenant-a\.localhost:2050\/dashboard/);

    // Try to access Tenant B's subdomain
    await page.goto("http://tenant-b.localhost:2050/dashboard");

    // Should redirect to unauthorized page
    await expect(page).toHaveURL(/unauthorized/);
    await expect(page.locator("h1")).toContainText("Access Denied");
  });

  test("API routes filter data by tenant", async ({ request }) => {
    // Get auth token for Tenant A user
    const loginResponse = await request.post("http://tenant-a.localhost:2050/api/auth/signin", {
      data: {
        email: "user-a@tenant-a.com",
        password: "password123",
      },
    });
    const cookies = loginResponse.headers()["set-cookie"];

    // Request cases from Tenant A
    const casesA = await request.get("http://tenant-a.localhost:2050/api/cases", {
      headers: { cookie: cookies },
    });
    const dataA = await casesA.json();

    // Verify all cases belong to Tenant A
    expect(dataA.every(c => c.tenantId === "tenant-a-id")).toBe(true);

    // Try to request cases from Tenant B with Tenant A credentials
    const casesB = await request.get("http://tenant-b.localhost:2050/api/cases", {
      headers: { cookie: cookies },
    });

    // Should return 401 or 403
    expect(casesB.status()).toBeGreaterThanOrEqual(401);
  });

  test("Database RLS prevents cross-tenant queries", async ({ request }) => {
    // This test requires direct database access (via Prisma)
    // Login as Tenant A user, get session token
    const loginA = await request.post("http://tenant-a.localhost:2050/api/auth/signin", {
      data: { email: "user-a@tenant-a.com", password: "password123" },
    });
    const cookiesA = loginA.headers()["set-cookie"];

    // Make API call that should return ONLY Tenant A data
    const response = await request.get("http://tenant-a.localhost:2050/api/cases", {
      headers: { cookie: cookiesA },
    });
    const cases = await response.json();

    // Verify NO cases from Tenant B or C appear
    const tenantBCaseIds = ["tenant-b-case-1", "tenant-b-case-2"]; // Known Tenant B case IDs
    const hasCrossTenantData = cases.some(c => tenantBCaseIds.includes(c.id));

    expect(hasCrossTenantData).toBe(false);
  });

  test("Subdomain extraction works correctly", async ({ page }) => {
    // Test various subdomain formats
    await page.goto("http://my-agency.localhost:2050/");
    // Should NOT redirect to error page
    await expect(page).not.toHaveURL(/no-tenant/);

    await page.goto("http://localhost:2050/");
    // Should redirect to no-tenant error
    await expect(page).toHaveURL(/no-tenant/);

    await page.goto("http://www.localhost:2050/");
    // www should redirect to no-tenant (not a valid tenant slug)
    await expect(page).toHaveURL(/no-tenant/);
  });
});
```

#### Step 15: Create Playwright Config for Multi-Tenant Tests
**File**: `playwright.config.ts`
**Action**: Update to support subdomain testing

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:2050",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:2050",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## CodeBakers Patterns (Inline)

### Pattern 1: API Route Structure
From CODEBAKERS.md - Every API route follows this order:
1. Parse and validate input (Zod schema)
2. Auth check (extract tenant + user context)
3. Business logic wrapped in try/catch
4. Return JSON response with proper status codes

### Pattern 2: TypeScript Strict Mode
- NO `any` types allowed
- All functions have explicit return types
- Props interfaces defined above components
- Zod schemas for all input validation

### Pattern 3: Error Handling
- Every async operation in try/catch
- Log errors with context: `console.error("[Route Name]", error)`
- Return user-friendly error messages (never expose stack traces)
- Status codes: 400 (bad input), 401 (not authed), 403 (forbidden), 404 (not found), 500 (server error)

### Pattern 4: Database Queries
- Use Prisma's type-safe query builder
- Never use raw SQL for business logic (only for RLS setup)
- Always disconnect Prisma client in finally block
- Batch queries where possible (use `prisma.$transaction()`)

### Pattern 5: Middleware Order
1. Auth verification
2. Tenant resolution
3. User-tenant validation
4. Header injection
5. Continue to route

---

## What NOT to Do

### ❌ DO NOT:
1. **Skip RLS policies** - Database MUST enforce tenant isolation, middleware is not enough
2. **Use `any` type** - TypeScript strict mode required
3. **Hardcode tenant IDs** - Always extract from request headers
4. **Leave TODO comments** - Complete all logic, no placeholders
5. **Skip error pages** - Users must see friendly errors, not Next.js default 404
6. **Forget to disconnect Prisma** - Use finally blocks to prevent connection leaks
7. **Update ALL 80+ API routes at once** - Start with high-priority routes, verify they work, then do others
8. **Skip tests** - Tenant isolation is CRITICAL, tests are non-negotiable
9. **Commit .env.local** - Secrets stay local, never in git
10. **Break existing features** - Ensure current dashboard still works after changes

### ✅ DO:
1. **Test locally first** - Use `test-agency.localhost:2050` for dev testing
2. **Add indexes** - Every foreign key gets an index
3. **Log tenant context** - Help debug issues: `console.log("[API] tenantId:", tenantId)`
4. **Validate subdomain format** - 3-30 chars, lowercase, alphanumeric + hyphens
5. **Check RLS is enabled** - Run SQL: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

---

## Verification Checklist (8+ Items)

### Database Schema
- [ ] 1. **Tenant model exists** in prisma/schema.prisma with all fields
- [ ] 2. **All 18+ core models have tenantId field** (User, Case, Quote, Commission, Contract, Organization, Goal, Notification, AuditLog, ProductInfo, HelpArticle, FAQ, Resource, Course, TrainingEvent, SmartOfficePolicy, SmartOfficeAgent, SmartOfficeSyncLog, SmartOfficeCustomReport, SmartOfficeChatHistory)
- [ ] 3. **Migration runs successfully** without errors: `npx prisma migrate status` shows "Database is up to date"
- [ ] 4. **Prisma Client generates** without errors: `npx prisma generate` succeeds

**How to test**:
```bash
npx prisma migrate status
npx prisma generate
npx prisma studio # Open GUI, verify tenants table exists
```

### Row Level Security
- [ ] 5. **RLS enabled on all tenant-scoped tables**: Run SQL query:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('users', 'cases', 'quotes');
  ```
  All should return `rowsecurity = t` (true)

- [ ] 6. **RLS policies exist**: Run SQL query:
  ```sql
  SELECT schemaname, tablename, policyname FROM pg_policies
  WHERE tablename IN ('users', 'cases', 'quotes');
  ```
  Should return policies named `tenant_isolation_*`

**How to test**:
```bash
# Via Supabase SQL Editor or psql
# Run queries above, verify output
```

### Middleware & Routing
- [ ] 7. **Subdomain extraction works**: Visit `http://test-agency.localhost:2050/dashboard` → Should NOT redirect to error (middleware extracts "test-agency")
- [ ] 8. **Root domain redirects**: Visit `http://localhost:2050/dashboard` → Should redirect to `/no-tenant` error page
- [ ] 9. **Invalid tenant redirects**: Visit `http://fake-tenant.localhost:2050/dashboard` → Should redirect to `/tenant-not-found`
- [ ] 10. **Tenant context headers injected**: In browser DevTools Network tab, inspect any API request → Should have `x-tenant-id` and `x-user-id` headers

**How to test**:
```bash
npm run dev
# Visit URLs above in browser
# Open DevTools → Network → Click API request → Check Headers
```

### API Routes
- [ ] 11. **High-priority routes updated** (at minimum: `/api/cases`, `/api/quotes`, `/api/commissions`) - Code review shows `getTenantContext()` and `withTenantContext()` used
- [ ] 12. **API returns tenant-filtered data**: Make authenticated request to `/api/cases` → Response JSON should ONLY contain cases with matching `tenantId`

**How to test**:
```bash
# Create 2 test tenants in database
# Create test cases in each tenant
# Login as Tenant A user
# Call API: curl http://tenant-a.localhost:2050/api/cases -H "Cookie: <session-cookie>"
# Verify response only has Tenant A cases
```

### Error Pages
- [ ] 13. **No-tenant page renders**: Visit `http://localhost:2050/` → See "No Tenant Found" message
- [ ] 14. **Tenant-not-found page renders**: Visit `http://invalid.localhost:2050/` → See "Tenant Not Found" message
- [ ] 15. **Unauthorized page renders**: Login as Tenant A, try to access Tenant B subdomain → See "Access Denied" message

**How to test**: Visit URLs above, verify error messages appear

### End-to-End Tests
- [ ] 16. **Playwright tenant isolation test passes**: Run `npm run test:e2e -- multi-tenant-isolation.spec.ts` → All tests pass
- [ ] 17. **Unit tests pass**: Run `npm run test -- tenant-context.test.ts` → All tests pass

**How to test**:
```bash
npm run test:e2e
npm run test
```

### Integration Verification
- [ ] 18. **Existing dashboard still works**: Login to existing dev environment → Dashboard loads without errors
- [ ] 19. **No console errors**: Check browser console → No errors related to tenant context
- [ ] 20. **TypeScript compiles**: Run `npm run type-check` → Zero errors

**How to test**:
```bash
npm run type-check
npm run build
# If build succeeds, TypeScript is clean
```

---

## Final Checklist Before Marking Complete

- [ ] All verification items above pass
- [ ] No `TODO` comments in code
- [ ] No `console.log` debug statements (only `console.error` for errors)
- [ ] Git commit created: `git commit -m "feat: add multi-tenant foundation with RLS"`
- [ ] BUILD-STATE.md updated with completed status
- [ ] MASTER.md Feature 1 marked as ✅
- [ ] Ready to proceed to Feature 2 (Tenant Onboarding)

---

**IMPORTANT NOTES**:
1. This is a FOUNDATIONAL feature - every subsequent feature depends on it working perfectly
2. Tenant isolation is a SECURITY feature - treat it with highest priority
3. If ANY verification item fails, DO NOT proceed to Feature 2
4. When in doubt, add MORE tests, not fewer
5. This feature touches 30+ files - expect 5-7 days of focused work
6. Break the work into phases (A, B, C, D, E, F) and verify each phase before moving on

**SUCCESS DEFINITION**:
When Feature 1 is complete, a developer should be able to:
1. Create 3 test tenants via SQL
2. Login as user from Tenant A at `tenant-a.localhost:2050`
3. See ONLY Tenant A's data in dashboard
4. Attempt to access `tenant-b.localhost:2050` → Get "Access Denied" error
5. Run E2E tests → All pass
6. Deploy to Vercel with wildcard DNS → Subdomains work in production

**This prompt is your complete guide. Follow every step. Test every checkpoint. Verify every outcome. Do not skip steps. Do not take shortcuts.**

---
**END OF PROMPT**
