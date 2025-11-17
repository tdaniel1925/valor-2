import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/quotes - Get all quotes for current user
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    const quotes = await prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
