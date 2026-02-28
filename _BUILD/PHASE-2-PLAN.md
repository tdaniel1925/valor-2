# PHASE 2: TENANT ONBOARDING - BUILD PLAN

**Status**: Ready to Build
**Dependencies**: ✅ Phase 1 Complete (Multi-Tenant Foundation)
**Estimated Duration**: 2-3 days
**Complexity**: Medium

---

## Overview

Build a complete tenant onboarding flow that allows agencies to sign up, create their subdomain, and get started with Valor FS.

### User Journey
1. User visits `valorfs.app` (root domain)
2. Clicks "Sign Up" → fills out form (email, password, agency name, subdomain)
3. System validates subdomain availability
4. Creates tenant + first admin user
5. Sends verification email
6. User verifies email
7. Redirects to `{subdomain}.valorfs.app/dashboard`

---

## Feature Breakdown

### Feature 2.1: Signup Flow (5 files)
**Complexity**: M | **Duration**: 1 day

#### Files to Create:
1. `app/(auth)/signup/page.tsx` - Signup form UI
2. `app/api/auth/signup/route.ts` - Signup API endpoint
3. `lib/tenants/slug-validator.ts` - Subdomain validation logic
4. `lib/tenants/create-tenant.ts` - Tenant creation logic
5. `lib/email/verification-email.ts` - Email templates

#### Functionality:
- **Signup Form**:
  - Fields: email, password, confirm password, agency name, subdomain
  - Real-time subdomain validation (check availability as user types)
  - Password strength indicator
  - Terms of service checkbox
  - Form validation with error messages

- **Subdomain Validation**:
  - Alphanumeric + hyphens only
  - 3-50 characters
  - Cannot start/end with hyphen
  - Reserved slugs (admin, api, www, app, etc.) blocked
  - Check database for uniqueness

- **Signup API**:
  - Validate all inputs server-side
  - Check email not already in use
  - Check subdomain available
  - Create Supabase Auth user
  - Create Tenant record (slug, name, emailSlug, status=TRIAL)
  - Create User record (tenantId, role=OWNER)
  - Send verification email
  - Return success with redirect URL

- **Email Generation**:
  - Custom email slug: `{slug}@reports.valorfs.app`
  - Store in tenant.emailSlug field
  - Display in onboarding success page

#### Tests:
- ✅ Valid signup creates tenant + user
- ✅ Duplicate email rejected
- ✅ Duplicate subdomain rejected
- ✅ Invalid subdomain formats rejected
- ✅ Reserved slugs (admin, api, www) blocked
- ✅ Password strength requirements enforced
- ✅ User created in correct tenant
- ✅ Email verification sent

---

### Feature 2.2: Onboarding Pages (3 files)
**Complexity**: S | **Duration**: 0.5 days

#### Files to Create:
1. `app/onboarding/success/page.tsx` - Post-signup success page
2. `app/onboarding/verify-email/page.tsx` - Email verification handler
3. `lib/email/resend-verification.ts` - Resend verification logic

#### Functionality:
- **Success Page**:
  - Congratulations message
  - Display custom email: `{slug}@reports.valorfs.app`
  - Instructions: "Forward SmartOffice reports to this email"
  - Link to email verification
  - "Continue to Dashboard" button (disabled until verified)

- **Email Verification**:
  - Receives token from email link
  - Validates token with Supabase Auth
  - Marks user as verified
  - Redirects to `{subdomain}.valorfs.app/dashboard`
  - Shows error if token invalid/expired
  - "Resend verification email" button

- **Email Templates**:
  - Welcome email with verification link
  - Branded HTML template
  - Plain text fallback
  - Includes subdomain info

#### Tests:
- ✅ Success page displays correct email slug
- ✅ Valid verification token redirects to dashboard
- ✅ Invalid token shows error
- ✅ Resend verification works
- ✅ User redirected to correct subdomain

---

### Feature 2.3: Login Flow Updates (2 files)
**Complexity**: S | **Duration**: 0.5 days

#### Files to Modify:
1. `app/(auth)/login/page.tsx` - Add tenant context
2. `middleware.ts` - Add auth redirect logic

#### Functionality:
- **Login Page**:
  - Check subdomain from request
  - If root domain (`valorfs.app`) → redirect to signup
  - If subdomain → show login form with tenant name
  - "Forgot password" link
  - "Don't have an account? Sign up" link

- **Middleware Updates**:
  - If authenticated + tenant verified → allow access
  - If authenticated + tenant NOT verified → redirect to /onboarding/verify-email
  - If not authenticated → redirect to /login
  - Public paths: /signup, /login, /onboarding/verify-email

#### Tests:
- ✅ Root domain redirects to signup
- ✅ Subdomain shows login form
- ✅ Unverified users redirected to verification
- ✅ Verified users access dashboard

---

## Technical Implementation Details

### Database Schema (Already Exists)
```prisma
model Tenant {
  id         String   @id @default(uuid())
  slug       String   @unique // subdomain
  name       String   // agency name
  emailSlug  String   @unique // custom email prefix
  status     TenantStatus @default(TRIAL)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model User {
  id            String  @id // Supabase Auth ID
  tenantId      String
  tenant        Tenant  @relation(...)
  email         String  @unique
  firstName     String?
  lastName      String?
  role          UserRole
  status        UserStatus
  emailVerified Boolean @default(false)
}
```

### Slug Validation Rules
```typescript
export function isValidSlug(slug: string): boolean {
  // 3-50 characters
  if (slug.length < 3 || slug.length > 50) return false;

  // Alphanumeric + hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) return false;

  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) return false;

  // No consecutive hyphens
  if (slug.includes('--')) return false;

  // Reserved slugs
  const reserved = ['admin', 'api', 'www', 'app', 'mail', 'support', 'help'];
  if (reserved.includes(slug)) return false;

  return true;
}
```

### Signup API Flow
```typescript
POST /api/auth/signup
Body: { email, password, agencyName, subdomain }

1. Validate inputs
2. Check slug availability: SELECT * FROM tenants WHERE slug = ?
3. Create Supabase user: supabase.auth.signUp({ email, password })
4. Create tenant: INSERT INTO tenants (slug, name, emailSlug, status)
5. Create user: INSERT INTO users (id, tenantId, email, role)
6. Send verification email
7. Return: { success, redirectTo: '/onboarding/success?slug={slug}' }
```

---

## UI Components Needed

### SignupForm.tsx
- Email input with validation
- Password input with strength meter
- Agency name input
- Subdomain input with live availability check
- Terms checkbox
- Submit button with loading state
- Error message display

### SubdomainInput.tsx (Reusable Component)
```tsx
<SubdomainInput
  value={slug}
  onChange={setSlug}
  onValidate={checkAvailability}
  isChecking={checking}
  isAvailable={available}
  error={error}
/>
```

Displays:
- Input field: `[___________].valorfs.app`
- Loading spinner while checking
- ✓ "Available!" if valid
- ✗ "Already taken" if exists
- Error message if invalid format

---

## Error Handling

### Client-Side Validation Errors:
- Email format invalid
- Password too weak (< 8 chars, no numbers/symbols)
- Passwords don't match
- Subdomain invalid format
- Terms not accepted

### Server-Side Errors:
- Email already registered
- Subdomain already taken
- Supabase Auth error (rate limit, etc.)
- Database error
- Email sending failed (log but don't block signup)

### Error Messages:
```typescript
const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'An account with this email already exists',
  SLUG_TAKEN: 'This subdomain is already taken. Try another!',
  SLUG_INVALID: 'Subdomain must be 3-50 characters, letters/numbers/hyphens only',
  SLUG_RESERVED: 'This subdomain is reserved. Please choose another',
  WEAK_PASSWORD: 'Password must be at least 8 characters with a number and symbol',
  GENERIC: 'Something went wrong. Please try again',
};
```

---

## Testing Strategy

### Unit Tests (Vitest)
- `slug-validator.test.ts` - Test all validation rules
- `create-tenant.test.ts` - Test tenant creation logic

### E2E Tests (Playwright)
```typescript
test('happy path: complete signup flow', async ({ page }) => {
  // 1. Visit signup page
  await page.goto('https://valorfs.app/signup');

  // 2. Fill form
  await page.fill('[name=email]', 'test@agency.com');
  await page.fill('[name=password]', 'SecurePass123!');
  await page.fill('[name=confirmPassword]', 'SecurePass123!');
  await page.fill('[name=agencyName]', 'Test Agency');
  await page.fill('[name=subdomain]', 'test-agency');

  // 3. Wait for availability check
  await page.waitForSelector('text=Available!');

  // 4. Accept terms
  await page.check('[name=terms]');

  // 5. Submit
  await page.click('button[type=submit]');

  // 6. Verify redirect to success page
  await page.waitForURL('**/onboarding/success**');

  // 7. Check custom email displayed
  await expect(page.locator('text=test-agency@reports.valorfs.app')).toBeVisible();
});

test('duplicate subdomain rejected', async ({ page }) => {
  // Create tenant first
  await createTestTenant('existing-slug');

  // Attempt signup with same slug
  await page.goto('https://valorfs.app/signup');
  await page.fill('[name=subdomain]', 'existing-slug');
  await page.blur('[name=subdomain]'); // Trigger validation

  // Verify error shown
  await expect(page.locator('text=already taken')).toBeVisible();

  // Verify submit disabled
  await expect(page.locator('button[type=submit]')).toBeDisabled();
});
```

---

## Dependencies & Prerequisites

### ✅ Already Complete (Phase 1):
- Tenant model exists in database
- RLS policies enforcing tenant isolation
- Middleware resolving tenant from subdomain
- Supabase Auth configured

### ⬜ Needed for Phase 2:
- Email service configured (Supabase Auth handles verification)
- Wildcard DNS configured (`*.valorfs.app` → Vercel)
- Root domain page (`app/page.tsx`) with signup CTA

---

## Acceptance Criteria

Phase 2 is complete when:

- ✅ User can sign up from `valorfs.app`
- ✅ Subdomain availability checked in real-time
- ✅ Tenant + user created in database
- ✅ User receives verification email
- ✅ Email verification works
- ✅ User redirected to `{subdomain}.valorfs.app/dashboard`
- ✅ All 12 E2E tests passing
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Accessible (WCAG AA)

---

## Next Steps After Phase 2

Once onboarding is complete, users will need:
1. **Phase 3**: SmartOffice ETL (so they can import data)
2. **Phase 4**: SmartOffice Dashboard (so they can view imported data)
3. **Phase 5**: AI Chat (so they can query data with natural language)

---

**Ready to build?** Say **GO** to start implementation!
