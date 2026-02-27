import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";

/**
 * GET /api/commissions
 * List commissions with filters (tenant-scoped)
 */
export async function GET(request: NextRequest) {
  try {
    // Get tenant context from middleware
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // Require authentication and get user ID from session
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);

    const caseId = searchParams.get("caseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause - filter by tenant AND authenticated user
    const where: any = {
      tenantId: tenantContext.tenantId,
      agentId: user.id,
    };

    if (caseId) {
      where.caseId = caseId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Use tenant-scoped database client with RLS
    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Get commissions with user and case info
      const [commissions, total] = await Promise.all([
        db.commission.findMany({
          where,
          include: {
            agent: {
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
        db.commission.count({ where }),
      ]);

      // Calculate totals by status
      const totals = await db.commission.groupBy({
        by: ["status"],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      });

      return { commissions, total, totals };
    });

    return NextResponse.json({
      success: true,
      data: {
        commissions: result.commissions,
        totals: result.totals,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("List commissions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list commissions" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/commissions
 * Update commission status (tenant-scoped)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get tenant context from middleware
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
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "EXPECTED", "RECEIVED", "PAID", "SPLIT", "DISPUTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Use tenant-scoped database client with RLS
    const commission = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Check if user owns this commission AND it belongs to the tenant
      const existingCommission = await db.commission.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
          agentId: user.id,
        },
      });

      if (!existingCommission) {
        throw new Error("Commission not found or you do not have permission to modify it");
      }

      const updateData: any = { status };

      if (status === "PAID") {
        updateData.paidDate = new Date();
      }

      if (status === "RECEIVED") {
        updateData.receivedDate = new Date();
      }

      if (notes) {
        updateData.notes = notes;
      }

      return await db.commission.update({
        where: { id },
        data: updateData,
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: commission,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === "Commission not found or you do not have permission to modify it") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update commission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update commission" },
      { status: 500 }
    );
  }
}
