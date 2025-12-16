import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/help/faqs - Get all FAQs with optional category filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { answer: { contains: search, mode: "insensitive" } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    // Group by category
    const groupedByCategory = faqs.reduce((acc: any, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        faqs,
        groupedByCategory,
        total: faqs.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
