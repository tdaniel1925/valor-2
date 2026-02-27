import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { requireAuth } from "@/lib/auth/server-auth";

// GET /api/audit-logs - Fetch audit logs with filtering (tenant-scoped)
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication - only admins should view audit logs
    const authUser = await requireAuth(request);

    // Check if user has admin privileges
    const user = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.user.findFirst({
        where: {
          id: authUser.id,
          tenantId: tenantContext.tenantId,
        },
        select: { role: true },
      });
    });

    if (user?.role !== 'ADMINISTRATOR' && user?.role !== 'EXECUTIVE') {
      return NextResponse.json(
        { error: "You do not have permission to view audit logs" },
        { status: 403 }
      );
    }

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

    const where: any = {
      tenantId: tenantContext.tenantId,
    };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch logs with user information
    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      const [logs, total] = await Promise.all([
        db.auditLog.findMany({
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
        db.auditLog.count({ where }),
      ]);

      return { logs, total };
    });

    return NextResponse.json({
      logs: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs - Create a new audit log entry (tenant-scoped)
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { action, entityType, entityId, changes, ipAddress, userAgent } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    const log = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.auditLog.create({
        data: {
          tenantId: tenantContext.tenantId,
          userId: authUser.id, // Always use authenticated user ID
          action,
          entityType: entityType || null,
          entityId: entityId || null,
          changes: changes || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    });

    return NextResponse.json({ log });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
