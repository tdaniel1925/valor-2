import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/goals - Get user's goals
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual user ID from Supabase auth
    const userId = "demo-user-id";

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        let current = 0;

        if (goal.type === "COMMISSION") {
          const result = await prisma.commission.aggregate({
            where: {
              userId,
              status: "PAID",
              paidAt: {
                gte: goal.startDate,
                lte: goal.endDate,
              },
            },
            _sum: { amount: true },
          });
          current = result._sum.amount || 0;
        } else if (goal.type === "CASES") {
          const count = await prisma.case.count({
            where: {
              userId: userId,
              status: "APPROVED",
              createdAt: {
                gte: goal.startDate,
                lte: goal.endDate,
              },
            },
          });
          current = count;
        } else if (goal.type === "PRODUCTION") {
          const result = await prisma.case.aggregate({
            where: {
              userId: userId,
              status: "APPROVED",
              createdAt: {
                gte: goal.startDate,
                lte: goal.endDate,
              },
            },
            _sum: { premium: true },
          });
          current = result._sum?.premium || 0;
        }

        const progress = goal.target > 0 ? (current / goal.target) * 100 : 0;

        return {
          ...goal,
          current,
          progress: Math.min(progress, 100),
        };
      })
    );

    return NextResponse.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with actual user ID from Supabase auth
    const userId = "demo-user-id";

    const body = await request.json();
    const { title, type, target, startDate, endDate, description } = body;

    if (!title || !type || !target || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        type,
        target: parseFloat(target),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

// PUT /api/goals - Update a goal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, type, target, startDate, endDate, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(target && { target: parseFloat(target) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals - Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
