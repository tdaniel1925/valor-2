import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/commissions
 * List commissions with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    // If no userId provided, use demo user for now
    // TODO: Replace with actual auth user ID from Supabase
    if (userId) {
      where.userId = userId;
    } else {
      where.userId = "demo-user-id";
    }

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Get commissions with user and case info
    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          case: {
            select: {
              id: true,
              clientName: true,
              policyNumber: true,
              carrier: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.commission.count({ where }),
    ]);

    // Calculate totals by status
    const totals = await prisma.commission.groupBy({
      by: ["status"],
      where,
      _sum: {
        amount: true,
        splitAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        totals,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error: any) {
    console.error("List commissions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list commissions" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/commissions
 * Update commission status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "PAID", "CANCELLED", "DISPUTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    if (status === "PAID") {
      updateData.paidAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: commission,
    });
  } catch (error: any) {
    console.error("Update commission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update commission" },
      { status: 500 }
    );
  }
}
