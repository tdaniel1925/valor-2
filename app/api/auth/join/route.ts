import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logging/logger";

/**
 * POST /api/auth/join
 *
 * Agent self-signup into an EXISTING agency tenant (no subdomain, no new
 * tenant, no Stripe). The user is created in the default agent tenant and, on
 * login, is matched to their SmartOffice book by email (lib/downline/service).
 *
 * New AGENCIES use /api/auth/signup instead (that one creates a tenant).
 */
const joinSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// The agency agents join. Configurable so this isn't hardcoded long-term, but
// defaults to Valor (the only live agency today).
const DEFAULT_AGENT_TENANT =
  process.env.DEFAULT_AGENT_TENANT_ID || "valor-default-tenant";

export async function POST(request: Request) {
  const logger = createLogger({ route: "auth/join" });
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = joinSchema.parse(body);

    // Tenant must exist.
    const tenant = await prisma.tenant.findUnique({
      where: { id: DEFAULT_AGENT_TENANT },
      select: { id: true, slug: true },
    });
    if (!tenant) {
      logger.error("Agent join: default tenant missing", { tenant: DEFAULT_AGENT_TENANT });
      return NextResponse.json(
        { error: "Signup is temporarily unavailable. Please contact your administrator." },
        { status: 503 }
      );
    }

    // Reject if a user with this email already exists in the tenant.
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId: tenant.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // require verification
    });
    if (authError || !authData.user) {
      logger.error("Agent join: supabase auth error", { email, error: authError?.message });
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 500 }
      );
    }

    // Create the User row in the existing tenant (RLS context required).
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant.id}'`);
      await tx.user.create({
        data: {
          id: authData.user!.id,
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

    logger.info("Agent join successful", { email, tenantId: tenant.id });
    return NextResponse.json({ success: true, data: { tenantSlug: tenant.slug } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    const e = error as { code?: string; message?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    logger.error("Agent join error", { error: e.message });
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
