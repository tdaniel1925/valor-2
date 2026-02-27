import { NextRequest, NextResponse } from "next/server";
import { saveQuote } from "@/lib/quotes/calculator";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * POST /api/quotes/save
 * Save a quote to the database (tenant-scoped)
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const { quoteData, quoteResult } = body;

    if (!quoteData || !quoteResult) {
      return NextResponse.json(
        { error: "quoteData and quoteResult are required" },
        { status: 400 }
      );
    }

    // Save quote with tenant context
    // TODO: Update saveQuote function to accept tenantId parameter
    const savedQuote = await saveQuote(user.id, quoteData, quoteResult);

    return NextResponse.json({
      success: true,
      data: savedQuote,
      message: "Quote saved successfully",
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Save quote error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save quote" },
      { status: 500 }
    );
  }
}
