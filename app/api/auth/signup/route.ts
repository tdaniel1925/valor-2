import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { isValidSlug } from "@/lib/tenants/slug-validator";
import { generateInboundEmailAddress } from "@/lib/email/generate-inbound-address";
import { applyRateLimit, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { signUpSchema } from "@/lib/validation/auth-schemas";
import { ZodError } from "zod";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/auth/signup',
  });

  // Apply rate limiting to prevent signup abuse
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.AUTH_SIGNUP);
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for signup attempt');
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = signUpSchema.parse(body);
    const { email, password, agencyName, subdomain } = validatedData;

    logger.info('Signup attempt', { email, subdomain, agencyName });

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: subdomain },
    });

    if (existingTenant) {
      logger.warn('Signup failed - subdomain already exists', { subdomain });
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
      logger.error('Supabase auth error during signup', {
        email,
        error: authError?.message,
        code: authError?.code
      });
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Generate unique inbound email address
    const inboundEmailAddress = await generateInboundEmailAddress();

    // Create Tenant in transaction with RLS context
    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant (no RLS on tenants table)
      const newTenant = await tx.tenant.create({
        data: {
          slug: subdomain,
          name: agencyName,
          emailSlug: subdomain, // Same as slug by default
          status: "TRIAL",
          inboundEmailAddress,
          inboundEmailEnabled: true,
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
          firstName: "",
          lastName: "",
          role: "ADMINISTRATOR",
          status: "ACTIVE",
          emailVerified: false,
        },
      });

      return newTenant;
    });

    logger.info('Signup successful', {
      tenantId: tenant.id,
      slug: tenant.slug,
      email,
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
    logger.error('Signup error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });

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
