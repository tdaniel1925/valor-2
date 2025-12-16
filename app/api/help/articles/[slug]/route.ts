import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/help/articles/:slug - Get a specific help article by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await prisma.helpArticle.findUnique({
      where: { slug },
      include: {
        children: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            category: true,
            tags: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.helpArticle.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    // Get related articles
    const relatedArticles = article.relatedArticles.length > 0
      ? await prisma.helpArticle.findMany({
          where: {
            id: { in: article.relatedArticles },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            category: true,
            tags: true,
          },
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        relatedArticles,
      },
    });
  } catch (error: any) {
    console.error("Error fetching help article:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch help article" },
      { status: 500 }
    );
  }
}
