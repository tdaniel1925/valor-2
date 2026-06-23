import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/auth/verify-email
 *
 * Marks the authenticated user's email verified and returns their tenant slug
 * for redirect. Runs server-side via Prisma so the browser never needs direct
 * Supabase REST (PostgREST) access to the users/tenants tables.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 401 });
    }

    const userId = session.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenant: { select: { slug: true } } },
    });

    return NextResponse.json({ success: true, tenantSlug: user?.tenant?.slug ?? null });
  } catch (error) {
    console.error("[AUTH] verify-email error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
