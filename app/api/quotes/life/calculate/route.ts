import { NextRequest, NextResponse } from "next/server";
import { calculateLifeInsuranceQuote } from "@/lib/quotes/calculator";

/**
 * POST /api/quotes/life/calculate
 * Calculate life insurance quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      productType,
      termLength,
      faceAmount,
      age,
      gender,
      healthClass,
      tobaccoUse,
      state,
    } = body;

    // Validate required fields
    if (
      !productType ||
      !faceAmount ||
      !age ||
      !gender ||
      !healthClass ||
      tobaccoUse === undefined ||
      !state
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: productType, faceAmount, age, gender, healthClass, tobaccoUse, state",
        },
        { status: 400 }
      );
    }

    // Validate productType
    if (!["TERM", "WHOLE_LIFE", "UNIVERSAL_LIFE", "IUL"].includes(productType)) {
      return NextResponse.json(
        { error: "Invalid productType" },
        { status: 400 }
      );
    }

    // Validate termLength for term life
    if (productType === "TERM" && !termLength) {
      return NextResponse.json(
        { error: "termLength is required for term life insurance" },
        { status: 400 }
      );
    }

    const quote = calculateLifeInsuranceQuote({
      productType,
      termLength: termLength ? parseInt(termLength) : undefined,
      faceAmount: parseFloat(faceAmount),
      age: parseInt(age),
      gender,
      healthClass,
      tobaccoUse: Boolean(tobaccoUse),
      state,
    });

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error("Life insurance quote calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate quote" },
      { status: 500 }
    );
  }
}
