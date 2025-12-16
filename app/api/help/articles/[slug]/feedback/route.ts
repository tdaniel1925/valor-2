import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/help/articles/:slug/feedback - Submit feedback for an article
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { isHelpful } = await request.json();

    const article = await prisma.helpArticle.findUnique({
      where: { slug },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Update the appropriate counter
    await prisma.helpArticle.update({
      where: { slug },
      data: {
        [isHelpful ? "helpfulCount" : "notHelpfulCount"]: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
