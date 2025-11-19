import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/audit-logs - Fetch audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch logs with user information
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs - Create a new audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, entityType, entityId, changes, ipAddress, userAgent } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        changes: changes || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
