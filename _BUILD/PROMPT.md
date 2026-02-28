# BUILD PROMPT - PHASE 2: TENANT ONBOARDING

## CURRENT CODEBASE STATE

### Stack
- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0
- **Database**: PostgreSQL via Prisma 6.19.0
- **Auth**: Supabase Auth (@supabase/ssr 0.7.0, @supabase/supabase-js 2.81.1)
- **Forms**: react-hook-form 7.66.0 + zod 4.1.12 + @hookform/resolvers 5.2.2
- **Queries**: @tanstack/react-query 5.90.10
- **Styling**: Tailwind CSS 3.4.18 + clsx 2.1.1 + tailwind-merge 3.4.0
- **TypeScript**: 5.9.3 (strict mode enabled)

### Existing Patterns

**Page Structure** (from `app/dashboard/page.tsx`):
```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
// ... other imports

export default function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["key"],
    queryFn: async () => {
      const res = await fetch("/api/endpoint");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) return <SkeletonComponent />;
  if (error || !data) return <ErrorState />;

  return <AppLayout user={data.user}>...</AppLayout>;
}
```

**API Route Pattern** (from `app/api/dashboard/route.ts`):
```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    // Auth (currently disabled for demo)
    // const user = await requireAuth(request);
    const userId = "demo-user-id";

    const body = await request.json();

    // Validation
    if (!body.field) {
      return NextResponse.json(
        { error: "Field required" },
        { status: 400 }
      );
    }

    // Database operation
    const result = await prisma.model.create({ data: {...} });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Middleware** (from `middleware.ts`):
- Extracts subdomain from hostname
- Resolves tenant via `resolveTenantContext(hostname)`
- Injects headers: `x-tenant-id`, `x-tenant-slug`, `x-tenant-name`, `x-subdomain`
- Handles Supabase Auth session
- Root domain check via `isRootDomain(hostname)`
- Path filtering via `pathRequiresTenant(pathname)`

---

## DATABASE SCHEMA

### Tenant Model (EXISTING)
```prisma
model Tenant {
  id              String   @id @default(uuid())
  name            String   // Agency name
  slug            String   @unique  // Subdomain
  emailSlug       String   @unique  // For reports@
  emailVerified   Boolean  @default(false)
  lastSyncAt      DateTime?
  plan            String?  @default("free")
  status          TenantStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  users           User[]
  organizations   Organization[]
  cases           Case[]
  quotes          Quote[]
  // ... other relations
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CHURNED
}
```

### User Model (EXISTING - relevant fields)
```prisma
model User {
  id            String  @id  // Supabase Auth UUID
  tenantId      String
  tenant        Tenant  @relation(...)
  email         String  @unique
  firstName     String?
  lastName      String?
  role          UserRole
  status        UserStatus
  emailVerified Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum UserRole {
  AGENT
  MANAGER
  ADMIN
  OWNER
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

---

## FILES TO CREATE

### 1. `app/(auth)/signup/page.tsx` (Signup Form UI)

**Purpose**: Client-side signup form with real-time subdomain validation

**Imports Needed**:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { isValidSlug } from "@/lib/tenants/slug-validator";
```

**TypeScript Schema**:
```tsx
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[!@#$%^&*]/, "Password must contain a special character"),
  confirmPassword: z.string(),
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), "Cannot start or end with hyphen")
    .refine((val) => !val.includes('--'), "Cannot contain consecutive hyphens"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;
```

**Component Structure**:
```tsx
export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  // Real-time subdomain validation
  const handleSubdomainBlur = async (value: string) => {
    if (!value || !isValidSlug(value)) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    setSlugError(null);

    try {
      const res = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(value)}`);
      const data = await res.json();

      if (data.available) {
        setSlugAvailable(true);
        setSlugError(null);
      } else {
        setSlugAvailable(false);
        setSlugError(data.reason || "This subdomain is already taken");
      }
    } catch (error) {
      setSlugError("Failed to check availability");
    } finally {
      setCheckingSlug(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          agencyName: data.agencyName,
          subdomain: data.subdomain,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Signup failed");
        return;
      }

      // Redirect to success page
      router.push(`/onboarding/success?slug=${data.subdomain}`);
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get your own subdomain and start managing your insurance business
            </p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                {...form.register("email")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                {...form.register("password")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                {...form.register("confirmPassword")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Agency Name</label>
              <input
                type="text"
                {...form.register("agencyName")}
                placeholder="Acme Insurance Agency"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.agencyName && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.agencyName.message}
                </p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium mb-1">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  {...form.register("subdomain")}
                  onBlur={(e) => handleSubdomainBlur(e.target.value)}
                  placeholder="acme-insurance"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">.valorfs.app</span>
              </div>
              {checkingSlug && (
                <p className="text-blue-500 text-xs mt-1">Checking availability...</p>
              )}
              {slugAvailable === true && (
                <p className="text-green-500 text-xs mt-1">✓ Available!</p>
              )}
              {slugAvailable === false && slugError && (
                <p className="text-red-500 text-xs mt-1">{slugError}</p>
              )}
              {form.formState.errors.subdomain && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.subdomain.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                {...form.register("terms")}
                className="mt-1"
              />
              <label className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {form.formState.errors.terms && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.terms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || slugAvailable === false}
              className="w-full"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 2. `app/api/auth/signup/route.ts` (Signup API)

**Purpose**: Create Supabase Auth user, Tenant, and User records with RLS context

**Imports**:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { isValidSlug } from "@/lib/tenants/slug-validator";
```

**Implementation**:
```ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, agencyName, subdomain } = body;

    // Validate inputs
    if (!email || !password || !agencyName || !subdomain) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate subdomain
    if (!isValidSlug(subdomain)) {
      return NextResponse.json(
        { error: "Invalid subdomain format" },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: subdomain },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 409 }
      );
    }

    // Create Supabase Auth user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
    });

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Create Tenant in transaction with RLS context
    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant (no RLS on tenants table)
      const newTenant = await tx.tenant.create({
        data: {
          slug: subdomain,
          name: agencyName,
          emailSlug: subdomain, // Same as slug by default
          status: "TRIAL",
        },
      });

      // Set RLS context for user creation
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${newTenant.id}'`
      );

      // Create user with tenant context
      await tx.user.create({
        data: {
          id: authData.user.id,
          tenantId: newTenant.id,
          email: email,
          role: "OWNER",
          status: "ACTIVE",
          emailVerified: false,
        },
      });

      return newTenant;
    });

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        slug: tenant.slug,
        emailSlug: `${tenant.emailSlug}@reports.valorfs.app`,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    // Check for unique constraint violations
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      if (error.meta?.target?.includes('slug')) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
```

---

### 3. `app/api/auth/check-slug/route.ts` (Slug Availability Check)

**Purpose**: Check if subdomain is available (called during form input)

**Implementation**:
```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/tenants/slug-validator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    // Check format
    if (!isValidSlug(slug)) {
      return NextResponse.json({
        available: false,
        reason: "Invalid format. Use 3-50 lowercase letters, numbers, and hyphens only.",
      });
    }

    // Check reserved
    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json({
        available: false,
        reason: "This subdomain is reserved.",
      });
    }

    // Check database
    const existing = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: "This subdomain is already taken.",
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Check slug error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
```

---

### 4. `lib/tenants/slug-validator.ts` (Validation Logic)

**Purpose**: Slug validation rules and reserved slugs list

**Implementation**:
```ts
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "www",
  "app",
  "mail",
  "email",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "marketing",
  "sales",
  "billing",
  "account",
  "dashboard",
  "portal",
  "login",
  "signup",
  "auth",
];

export function isValidSlug(slug: string): boolean {
  // Length check
  if (slug.length < 3 || slug.length > 50) {
    return false;
  }

  // Format check: lowercase alphanumeric + hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Cannot start or end with hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return false;
  }

  // No consecutive hyphens
  if (slug.includes("--")) {
    return false;
  }

  // Not reserved
  if (RESERVED_SLUGS.includes(slug)) {
    return false;
  }

  return true;
}

export function formatSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphen
    .replace(/--+/g, "-") // Remove consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
```

---

### 5. `app/onboarding/success/page.tsx` (Success Page)

**Purpose**: Show custom email and next steps after signup

**Implementation**:
```tsx
"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui";

export default function OnboardingSuccessPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Invalid access</p>
      </div>
    );
  }

  const customEmail = `${slug}@reports.valorfs.app`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Valor FS!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your account has been created successfully.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Your Custom Email Address</h2>
            <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-sm mb-3">
              {customEmail}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Forward your SmartOffice reports to this email address for automatic syncing.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">Next Steps:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Verify your email address (check your inbox)</li>
              <li>Forward SmartOffice reports to <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{customEmail}</span></li>
              <li>Wait for automatic data sync (usually takes 1-2 minutes)</li>
              <li>Access your dashboard at <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{slug}.valorfs.app</span></li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Button
              as={Link}
              href={`https://${slug}.valorfs.app/dashboard`}
              className="flex-1"
              disabled
            >
              Continue to Dashboard (after verification)
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Didn't receive the verification email?{" "}
            <Link href="/api/auth/resend-verification" className="text-blue-600 hover:underline">
              Resend
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 6. `app/onboarding/verify-email/page.tsx` (Email Verification Handler)

**Purpose**: Handle email verification token from Supabase email link

**Implementation**:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, Button } from "@/components/ui";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase automatically handles the token from URL
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError || !data.session) {
          setStatus("error");
          setError("Invalid or expired verification link");
          return;
        }

        // Update user's emailVerified status
        const { error: updateError } = await supabase
          .from("users")
          .update({ emailVerified: true })
          .eq("id", data.session.user.id);

        if (updateError) {
          console.error("Failed to update email verification:", updateError);
        }

        setStatus("success");

        // Get tenant slug and redirect
        const { data: userData } = await supabase
          .from("users")
          .select("tenant:tenants(slug)")
          .eq("id", data.session.user.id)
          .single();

        if (userData?.tenant?.slug) {
          setTimeout(() => {
            window.location.href = `https://${userData.tenant.slug}.valorfs.app/dashboard`;
          }, 2000);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setError("Verification failed");
      }
    };

    verifyEmail();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Verifying Your Email...</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error || "Something went wrong"}
              </p>
              <Button onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## WHAT NOT TO DO

### ❌ TypeScript Errors to Avoid

1. **DO NOT** use `any` type - use proper TypeScript interfaces
2. **DO NOT** access `form.formState.errors.field` without optional chaining
3. **DO NOT** forget to handle null/undefined in async operations
4. **DO NOT** use `as any` - properly type Prisma results
5. **DO NOT** forget to import types from Prisma: `import { Tenant, User, TenantStatus, UserRole } from "@prisma/client"`

### ❌ Database Errors to Avoid

1. **DO NOT** create Tenant without setting RLS context when creating User
2. **DO NOT** forget `await prisma.$transaction()` when creating related records
3. **DO NOT** use `prisma.user.create()` outside transaction - wrap in `$transaction()` with RLS context
4. **DO NOT** forget to check for unique constraint violations (P2002 error code)
5. **DO NOT** forget to set `SET LOCAL app.current_tenant_id` before creating tenant-scoped records

### ❌ Auth Errors to Avoid

1. **DO NOT** use `createClient()` client-side - use `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
2. **DO NOT** expose `SUPABASE_SERVICE_ROLE_KEY` to client - only use in API routes
3. **DO NOT** forget to validate email verification token
4. **DO NOT** create Supabase user without handling duplicate email errors

### ❌ Form Errors to Avoid

1. **DO NOT** submit form without validating slug availability
2. **DO NOT** allow submit button to be clickable when slug is unavailable
3. **DO NOT** forget to show loading states during async operations
4. **DO NOT** forget to clear error states when inputs change

### ❌ Navigation Errors to Avoid

1. **DO NOT** use `router.push()` for external subdomain redirects - use `window.location.href`
2. **DO NOT** forget to encode URL parameters with `encodeURIComponent()`
3. **DO NOT** redirect to subdomain before email verification

---

## VERIFICATION CHECKLIST

Before marking this task complete, verify:

### TypeScript Compilation
- [ ] `npm run type-check` passes with 0 errors
- [ ] No `any` types used
- [ ] All Prisma types properly imported
- [ ] All async functions properly typed

### Database Operations
- [ ] Tenant creation works in transaction
- [ ] User creation sets RLS context correctly
- [ ] Duplicate email rejected with proper error
- [ ] Duplicate subdomain rejected with proper error
- [ ] All database operations wrapped in try/catch

### Form Validation
- [ ] Email validation works client-side
- [ ] Password strength validation works
- [ ] Password confirmation validation works
- [ ] Subdomain format validation works
- [ ] Real-time slug availability check works
- [ ] Reserved slugs are blocked
- [ ] Submit button disabled when slug unavailable
- [ ] All error messages display correctly

### API Routes
- [ ] `/api/auth/signup` creates Tenant + User successfully
- [ ] `/api/auth/check-slug` returns correct availability status
- [ ] All API routes handle errors gracefully
- [ ] All API routes return proper status codes (400, 409, 500)

### Email Verification
- [ ] Supabase sends verification email
- [ ] Verification link redirects to `/onboarding/verify-email`
- [ ] Token validation works
- [ ] User.emailVerified updated to true
- [ ] Redirect to correct subdomain after verification

### UI/UX
- [ ] Signup form responsive on mobile
- [ ] Loading states show during async operations
- [ ] Success page displays correct custom email
- [ ] Error messages are clear and helpful
- [ ] Links to Terms and Privacy pages work

### Security
- [ ] Password requirements enforced (8+ chars, number, symbol)
- [ ] SUPABASE_SERVICE_ROLE_KEY only used server-side
- [ ] SQL injection prevented (using Prisma parameterized queries)
- [ ] XSS prevented (React auto-escapes)
- [ ] CSRF prevented (Supabase handles)

### Testing
- [ ] Can sign up with valid inputs
- [ ] Duplicate email shows error
- [ ] Duplicate subdomain shows error
- [ ] Invalid subdomain format shows error
- [ ] Reserved slug shows error
- [ ] Email verification flow works end-to-end

---

## BUILD ORDER

1. **Create `lib/tenants/slug-validator.ts`** (no dependencies)
2. **Create `app/api/auth/check-slug/route.ts`** (depends on #1)
3. **Create `app/api/auth/signup/route.ts`** (depends on #1)
4. **Create `app/(auth)/signup/page.tsx`** (depends on #1, #2)
5. **Create `app/onboarding/success/page.tsx`** (no dependencies)
6. **Create `app/onboarding/verify-email/page.tsx`** (no dependencies)
7. **Test all flows manually**
8. **Run `npm run type-check`**
9. **Fix any TypeScript errors**
10. **Test again**

---

## ENVIRONMENT VARIABLES NEEDED

Ensure these are in `.env.local`:

```bash
# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL="https://buteoznuikfowbwofabs.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Database (already exists)
DATABASE_URL="postgresql://valor_app_role:password@..."
DIRECT_URL="postgresql://valor_app_role:password@..."

# App (may need to add)
NEXT_PUBLIC_ROOT_DOMAIN="valorfs.app"
```

---

## SUCCESS CRITERIA

Phase 2 is complete when:

1. ✅ User can visit `valorfs.app/signup`
2. ✅ Form validates all inputs correctly
3. ✅ Subdomain availability checked in real-time
4. ✅ Signup creates Tenant + User in database
5. ✅ Verification email sent to user
6. ✅ User can verify email via link
7. ✅ After verification, redirected to `{slug}.valorfs.app/dashboard`
8. ✅ No TypeScript errors (`npm run type-check` passes)
9. ✅ No console errors in browser
10. ✅ All error cases handled gracefully

---

**Ready to build? All information needed is in this prompt. Build files in order 1-6, test after each file, and verify with the checklist.**
