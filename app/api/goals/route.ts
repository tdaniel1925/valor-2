import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { prisma } from "@/lib/db/prisma";
import { calculateUserGoals, calculateGoalProgress } from "@/lib/goals/calculator";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/goals - Get user's goals with progress (tenant-scoped)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;

    // Calculate progress for all user goals
    const goalsWithProgress = await calculateUserGoals(userId);

    // Get full goal details with tenant scoping
    const goals = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.goal.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          userId,
        },
        orderBy: { createdAt: "desc" },
      });
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
 * POST /api/goals - Create a new goal (tenant-scoped)
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

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

    const goal = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.goal.create({
        data: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          title,
          type,
          targetAmount: parseFloat(target),
          currentAmount: 0,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
        },
      });
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
 * PATCH /api/goals - Update a goal (tenant-scoped)
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

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

    const goal = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Check if user owns this goal AND it belongs to tenant
      const existingGoal = await db.goal.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
          userId: user.id,
        },
      });

      if (!existingGoal) {
        throw new Error("Goal not found or you do not have permission to modify it");
      }

      const updateData: any = {};

      if (title) updateData.title = title;
      if (type) updateData.type = type;
      if (target) updateData.targetAmount = parseFloat(target);
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (description !== undefined) updateData.description = description;

      return await db.goal.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === "Goal not found or you do not have permission to modify it") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals - Delete a goal (tenant-scoped)
export async function DELETE(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

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

    await withTenantContext(tenantContext.tenantId, async (db) => {
      // Check if user owns this goal AND it belongs to tenant
      const existingGoal = await db.goal.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
          userId: user.id,
        },
      });

      if (!existingGoal) {
        throw new Error("Goal not found or you do not have permission to delete it");
      }

      await db.goal.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === "Goal not found or you do not have permission to delete it") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete goal" },
      { status: 500 }
    );
  }
}
