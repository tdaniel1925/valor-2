import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/commissions - Get all commissions for current user
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    const commissions = await prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        case: {
          select: {
            id: true,
            clientName: true,
            productType: true,
          },
        },
      },
    });

    // Calculate totals by status
    const totals = await prisma.commission.groupBy({
      by: ["status"],
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return NextResponse.json({ commissions, totals });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}
