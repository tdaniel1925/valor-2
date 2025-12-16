import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/help/articles - Get all help articles with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "PUBLISHED";

    const where: any = {
      status,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { searchableText: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const articles = await prisma.helpArticle.findMany({
      where,
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        tags: true,
        summary: true,
        videoUrl: true,
        order: true,
        parentId: true,
        status: true,
        authorId: true,
        views: true,
        helpfulCount: true,
        notHelpfulCount: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    // Group by category for easier frontend rendering
    const groupedByCategory = articles.reduce((acc: any, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    }, {});

    const response = NextResponse.json({
      success: true,
      data: {
        articles,
        groupedByCategory,
        total: articles.length,
      },
    });

    // Cache for 5 minutes since help content changes infrequently
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error: any) {
    console.error("Error fetching help articles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch help articles" },
      { status: 500 }
    );
  }
}
