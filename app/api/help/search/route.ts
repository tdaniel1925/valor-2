import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/help/search - Search across help articles and FAQs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const searchTerm = query.trim();

    // Search help articles
    const articles = await prisma.helpArticle.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { searchableText: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
          { summary: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        summary: true,
        tags: true,
        views: true,
        helpfulCount: true,
      },
      take: 20,
      orderBy: [
        { helpfulCount: "desc" },
        { views: "desc" },
      ],
    });

    // Search FAQs
    const faqs = await prisma.fAQ.findMany({
      where: {
        isActive: true,
        OR: [
          { question: { contains: searchTerm, mode: "insensitive" } },
          { answer: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: [
        { helpfulCount: "desc" },
        { views: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        query: searchTerm,
        articles,
        faqs,
        totalResults: articles.length + faqs.length,
      },
    });
  } catch (error: any) {
    console.error("Error searching help content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search help content" },
      { status: 500 }
    );
  }
}
