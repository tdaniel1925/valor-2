import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/cases - Get all cases for current user
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    const cases = await prisma.case.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        quote: {
          select: {
            id: true,
            type: true,
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}
