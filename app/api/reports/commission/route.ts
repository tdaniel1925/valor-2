import { NextRequest, NextResponse } from "next/server";
import { generateCommissionReport, exportToCSV } from "@/lib/reports/generator";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/reports/commission
 * Generate commission report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId") || (await getUserIdOrDemo());
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
    console.error("Commission report error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate commission report" },
      { status: 500 }
    );
  }
}
