import { NextRequest, NextResponse } from "next/server";
import { calculateAnnuityQuote } from "@/lib/quotes/calculator";

/**
 * POST /api/quotes/annuity/calculate
 * Calculate annuity quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      productType,
      premium,
      age,
      deferralYears,
      guaranteedRate,
      participationRate,
      cappedRate,
      payoutYears,
    } = body;

    // Validate required fields
    if (!productType || !premium || !age) {
      return NextResponse.json(
        { error: "Missing required fields: productType, premium, age" },
        { status: 400 }
      );
    }

    // Validate productType
    if (!["FIXED", "VARIABLE", "INDEXED", "MYGA", "SPIA", "DIA"].includes(productType)) {
      return NextResponse.json(
        { error: "Invalid productType" },
        { status: 400 }
      );
    }

    const quote = calculateAnnuityQuote({
      productType,
      premium: parseFloat(premium),
      age: parseInt(age),
      deferralYears: deferralYears ? parseInt(deferralYears) : undefined,
      guaranteedRate: guaranteedRate ? parseFloat(guaranteedRate) : undefined,
      participationRate: participationRate
        ? parseFloat(participationRate)
        : undefined,
      cappedRate: cappedRate ? parseFloat(cappedRate) : undefined,
      payoutYears: payoutYears ? parseInt(payoutYears) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error("Annuity quote calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate quote" },
      { status: 500 }
    );
  }
}
