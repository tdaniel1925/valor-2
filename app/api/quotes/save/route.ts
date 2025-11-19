import { NextRequest, NextResponse } from "next/server";
import { saveQuote } from "@/lib/quotes/calculator";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * POST /api/quotes/save
 * Save a quote to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteData, quoteResult } = body;

    if (!quoteData || !quoteResult) {
      return NextResponse.json(
        { error: "quoteData and quoteResult are required" },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = await getUserIdOrDemo();

    // Save quote
    const savedQuote = await saveQuote(userId, quoteData, quoteResult);

    return NextResponse.json({
      success: true,
      data: savedQuote,
      message: "Quote saved successfully",
    });
  } catch (error: any) {
    console.error("Save quote error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save quote" },
      { status: 500 }
    );
  }
}
