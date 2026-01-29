import { NextRequest, NextResponse } from "next/server";
import { generateCommissionReport, exportToCSV } from "@/lib/reports/generator";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/reports/commission
 * Generate commission report
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeTeam = searchParams.get("includeTeam") === "true";
    const format = searchParams.get("format") || "json";

    const report = await generateCommissionReport(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      includeTeam
    );

    if (format === "csv") {
      const csv = exportToCSV(report);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="commission-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Commission report error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate commission report" },
      { status: 500 }
    );
  }
}
