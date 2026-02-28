import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { isValidSlug } from "@/lib/tenants/slug-validator";

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
          firstName: "",
          lastName: "",
          role: "ADMINISTRATOR",
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
