import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
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
    const { email, password, firstName, lastName, agencyName, subdomain } = validatedData;

    logger.info('Signup attempt', { email, subdomain, agencyName });

    // Reject if a user with this email already exists in the agency tenant.
    const DEFAULT_TENANT = process.env.DEFAULT_AGENT_TENANT_ID || "valor-default-tenant";
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId: DEFAULT_TENANT },
      select: { id: true },
    });
    if (existingUser) {
      logger.warn('Signup failed - email already registered', { email });
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
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

    // Everyone signing up is a member of the SAME existing agency tenant — we do
    // NOT create a separate tenant per signup (that left users in an empty tenant
    // with no SmartOffice book). The agency-name/subdomain fields are accepted but
    // only used cosmetically; the user joins the default agent tenant as an AGENT
    // and is matched to their SmartOffice book by email on login.
    const DEFAULT_AGENT_TENANT = process.env.DEFAULT_AGENT_TENANT_ID || "valor-default-tenant";

    const tenant = await prisma.tenant.findUnique({
      where: { id: DEFAULT_AGENT_TENANT },
      select: { id: true, slug: true, emailSlug: true },
    });
    if (!tenant) {
      logger.error('Signup failed - default tenant missing', { tenant: DEFAULT_AGENT_TENANT });
      return NextResponse.json(
        { error: "Signup is temporarily unavailable. Please contact your administrator." },
        { status: 503 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant.id}'`);
      await tx.user.create({
        data: {
          id: authData.user.id,
          tenantId: tenant.id,
          email: email.toLowerCase(),
          firstName,
          lastName,
          role: "AGENT",
          status: "ACTIVE",
          emailVerified: false,
        },
      });
    });

    logger.info('Signup successful (joined existing tenant)', {
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
