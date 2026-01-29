import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateUserGoals, calculateGoalProgress } from "@/lib/goals/calculator";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/goals - Get user's goals with progress
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const {
      title,
      type,
      target,
      startDate,
      endDate,
      description,
    } = body;

    if (!title || !type || !target || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, target, startDate, endDate" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title,
        type,
        target: parseFloat(target),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const { id, title, type, target, startDate, endDate, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Check if user owns this goal
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Goal not found or you do not have permission to modify it" },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (target) updateData.target = parseFloat(target);
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (description !== undefined) updateData.description = description;

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    // Require authentication
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Check if user owns this goal
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Goal not found or you do not have permission to delete it" },
        { status: 403 }
      );
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
