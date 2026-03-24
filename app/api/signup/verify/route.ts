import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.tenantSlug) {
      return NextResponse.json({ success: false, error: "Invalid session" });
    }

    // Check if tenant was created
    const tenant = await prisma.tenant.findUnique({
      where: { slug: session.metadata.tenantSlug },
      select: { id: true, slug: true, status: true },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not created yet" });
    }

    return NextResponse.json({
      success: true,
      tenantSlug: tenant.slug,
      status: tenant.status,
    });
  } catch (error) {
    console.error("Error verifying signup:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
