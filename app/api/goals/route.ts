import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateUserGoals, calculateGoalProgress } from "@/lib/goals/calculator";

/**
 * GET /api/goals - Get user's goals with progress
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user-id";

    // Calculate progress for all user goals
    const goalsWithProgress = await calculateUserGoals(userId);

    // Get full goal details
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Merge progress data with goal details
    const enrichedGoals = goals.map((goal) => {
      const progress = goalsWithProgress.find((p) => p.goalId === goal.id);
      return {
        ...goal,
        progress: progress || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedGoals,
    });
  } catch (error: any) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals - Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      metric,
      targetValue,
      startDate,
      endDate,
      description,
    } = body;

    // Use demo user if not provided
    const goalUserId = userId || "demo-user-id";

    if (!type || !metric || !targetValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: type, metric, targetValue, startDate, endDate" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: goalUserId,
        type,
        metric,
        targetValue: parseFloat(targetValue),
        currentValue: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create goal" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/goals - Update a goal
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, metric, targetValue, startDate, endDate, description, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (type) updateData.type = type;
    if (metric) updateData.metric = metric;
    if (targetValue) updateData.targetValue = parseFloat(targetValue);
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update goal" },
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
