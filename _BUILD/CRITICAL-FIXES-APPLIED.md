# CRITICAL SECURITY FIXES APPLIED
Date: 2026-04-11

## ✅ COMPLETED FIXES

### 1. Webhook Signature Validation (CRITICAL)
**Status:** FIXED ✅

**Files Modified:**
- `lib/integrations/webhook-handler.ts`
  - WinFlexWebhookHandler.validateSignature() - Lines 68-88
  - IPipelineWebhookHandler.validateSignature() - Lines 131-151
  - RateWatchWebhookHandler.validateSignature() - Lines 199-219
  - VapiWebhookHandler.validateSignature() - Lines 259-283

- `app/api/smartoffice/webhook/route.ts` - Lines 34-70

**Implementation:**
- Added HMAC-SHA256 signature validation using `crypto.timingSafeEqual()` for timing-attack protection
- All webhook handlers now properly validate signatures before processing
- Missing signature or secret now returns 401 Unauthorized
- Validation errors are logged for security monitoring

**Security Impact:** CRITICAL - Prevents attackers from sending fake webhooks to manipulate data

---

### 2. Admin Authorization Checks
**Status:** PARTIALLY FIXED ✅

**Files Modified:**
- `lib/auth/server-auth.ts`
  - Added `requireAdmin()` function (Lines 47-66)
  - Updated `canAccessUserResource()` with org-level access (Lines 68-112)

- `app/api/admin/users/route.ts`
  - GET endpoint - Line 27
  - POST endpoint - Line 75
  - PATCH endpoint - Line 114
  - DELETE endpoint - Line 162

**Implementation:**
- Created `requireAdmin()` helper that:
  - Validates user is authenticated
  - Fetches user role from database
  - Throws 403 error if not ADMINISTRATOR or EXECUTIVE role
- Applied to all `/api/admin/users/*` endpoints

**Security Impact:** HIGH - Prevents non-admin users from accessing admin-only functions

---

### 3. Organization Hierarchy Access Control
**Status:** FIXED ✅

**File Modified:**
- `lib/auth/server-auth.ts` - canAccessUserResource() function

**Implementation:**
- Admins/executives can access all tenant resources
- Managers can access resources in their organization
- Regular users can only access their own resources
- Proper database queries to validate org membership

**Impact:** Enables proper hierarchical access control

---

## ⚠️ REMAINING CRITICAL FIXES

### 4. Direct Prisma Usage (HIGH PRIORITY)
**Status:** TODO

**Files Requiring Fix:**
- `lib/admin/user-management.ts` - All functions use global `prisma` client
- Need to refactor to use `withTenantContext(tenantId, async (db) => ...)`

**Risk:** Potential cross-tenant data leakage if RLS bypassed

**Recommended Fix:**
```typescript
// BEFORE (UNSAFE):
const user = await prisma.user.create({ data: {...} });

// AFTER (SAFE):
await withTenantContext(tenantId, async (db) => {
  const user = await db.user.create({ data: {...} });
});
```

---

### 5. Rate Limiting (HIGH PRIORITY)
**Status:** TODO

**Endpoints Needing Protection:**
- `/api/auth/signin`
- `/api/auth/signup`
- `/api/auth/reset-password`
- All `/api/admin/*` endpoints
- All webhook endpoints

**Recommended Implementation:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

// In route handler:
const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

### 6. Input Validation with Zod (MEDIUM PRIORITY)
**Status:** TODO

**Files Needing Validation:**
- `app/api/admin/users/route.ts` - All endpoints
- `app/api/organizations/route.ts` - All endpoints
- `app/api/cases/route.ts` - All endpoints
- All other API routes accepting user input

**Example Implementation:**
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['ADMINISTRATOR', 'EXECUTIVE', 'MANAGER', 'AGENT']),
});

// In route:
try {
  const body = createUserSchema.parse(await request.json());
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues }, { status: 400 });
  }
}
```

---

### 7. Audit Logging to Database (MEDIUM PRIORITY)
**Status:** TODO

**File:** `lib/integrations/audit.ts` - Line 34

**Current Issue:**
```typescript
// TODO: Store in database when AuditLog table is available
console.log('[AUDIT]', JSON.stringify(entry));
```

**Fix Required:**
```typescript
await prisma.auditLog.create({
  data: {
    tenantId: entry.tenantId,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    changes: JSON.stringify(entry.details),
  },
});
```

**Note:** AuditLog table already exists in schema - just needs implementation

---

### 8. Report Calculations (HIGH PRIORITY - USER IMPACT)
**Status:** TODO

**Files with Hardcoded Zeros:**
- `app/api/reports/carriers/route.ts`
  - commissionRate: 0 (Line ~100)
  - growth: 0 (Line ~105)
  - averageUnderwritingTime: 0 (Line ~110)
  - topProducts: [] (Line ~115)

- `app/api/reports/agents/route.ts`
  - Similar placeholders (Lines 148-153)

- `app/api/reports/goal-tracking/route.ts` (Line 44)

- `app/api/reports/forecast/route.ts` (Line 163)

**Impact:** Users see incorrect/misleading business data

**Recommended Fix:**
1. Calculate actual commission rates from contracts table
2. Compare current period with previous for growth %
3. Calculate underwriting times from case date differences
4. Query top products from policies/cases table

---

### 9. Progress Meters Wire-up (HIGH PRIORITY - USER REQUEST)
**Status:** TODO

**User Request:** "Wire progress meters on front pages to production data from spreadsheets"

**Files Likely Needing Updates:**
- Dashboard page components showing progress
- Need to identify which progress meters exist
- Connect to actual SmartOffice data instead of mock/hardcoded values

**Action Items:**
1. Identify all dashboard progress meters
2. Determine data source (SmartOfficePolicy, Commission, Case tables)
3. Create API endpoints if needed
4. Wire up real-time data queries

---

### 10. Profile Form Submission (QUICK WIN)
**Status:** TODO

**File:** `app/profile/page.tsx` - Line 296

**Current Code:**
```typescript
// TODO: Implement form submission
```

**Fix Required:**
```typescript
const handleSubmit = async (data: ProfileFormData) => {
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Update failed');

    toast.success('Profile updated successfully');
  } catch (error) {
    toast.error('Failed to update profile');
  }
};
```

---

### 11. Quote Export/Save (MEDIUM PRIORITY)
**Status:** TODO

**Files:**
- `components/quotes/ProductComparison.tsx` - Line 71 (PDF export)
- `app/api/quotes/life/route.ts` - Line 76 (Save to DB)

**Required:**
1. Implement PDF generation (use jsPDF or Puppeteer)
2. Save quote results to database
3. Email quote to client

---

### 12. Email Notifications (MEDIUM PRIORITY)
**Status:** TODO

**File:** `app/api/webhooks/stripe/route.ts`

**Missing Emails:**
- Line 160: Welcome email after signup
- Line 230: Cancellation confirmation
- Line 258: Payment failed alert

**Recommended:** Use Resend, SendGrid, or AWS SES for transactional emails

---

## 🔒 SECURITY CHECKLIST

- [x] Webhook signature validation implemented
- [x] Admin role authorization on user management endpoints
- [x] Organization hierarchy access control
- [ ] Rate limiting on auth endpoints
- [ ] Input validation (Zod schemas)
- [ ] Audit logging persisted to database
- [ ] All admin endpoints have role checks
- [ ] Direct Prisma usage replaced with withTenantContext
- [ ] SQL injection protection verified
- [ ] XSS protection (CSP headers)
- [ ] CSRF protection
- [ ] Session management hardened

---

## 📊 PRIORITY MATRIX

### Week 1 (Critical)
1. ✅ Webhook signature validation
2. ✅ Admin authorization checks
3. ⚠️ Fix direct Prisma usage
4. ⚠️ Add rate limiting
5. ⚠️ Fix report calculations
6. ⚠️ Wire progress meters to real data

### Week 2 (High)
7. Input validation (Zod)
8. Audit logging to database
9. Profile form submission
10. Quote export/save

### Week 3 (Medium)
11. Email notifications
12. Complete remaining admin endpoints
13. Add monitoring/error tracking
14. Write tests for security features

---

## 📝 NOTES

- All error handling updated to catch admin permission errors
- Added proper 401/403 status codes
- Maintained backward compatibility
- No breaking changes to existing functionality

---

**Next Steps:** Continue with fixing direct Prisma usage and implementing rate limiting.
