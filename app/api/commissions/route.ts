import { NextRequest, NextResponse } from "next/server";
import { withVerifiedTenant } from "@/lib/auth/require-tenant-access";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";
import { z } from "zod";

// Query parameter validation schema
const commissionsQuerySchema = z.object({
  caseId: z.string().uuid('Invalid case ID').optional(),
  status: z
    .enum(['PENDING', 'EXPECTED', 'RECEIVED', 'PAID', 'SPLIT', 'DISPUTED'])
    .optional(),
  type: z
    .enum(['FIRST_YEAR', 'RENEWAL', 'BONUS', 'OVERRIDE', 'TRAIL'])
    .optional(),
  limit: z
    .string()
    .optional()
    .default('100')
    .pipe(
      z.string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .refine((n) => n >= 1 && n <= 1000, 'Limit must be between 1 and 1000')
    ),
  offset: z
    .string()
    .optional()
    .default('0')
    .pipe(
      z.string()
        .regex(/^\d+$/, 'Offset must be a number')
        .transform(Number)
        .refine((n) => n >= 0, 'Offset must be non-negative')
    ),
});

// Update commission validation schema
const updateCommissionSchema = z.object({
  id: z.string().uuid('Invalid commission ID'),
  status: z.enum(['PENDING', 'EXPECTED', 'RECEIVED', 'PAID', 'SPLIT', 'DISPUTED']),
  notes: z.string().max(1000, 'Notes cannot exceed 1,000 characters').optional(),
});

/**
 * GET /api/commissions
 * List commissions with filters (tenant-scoped)
 */
export async function GET(request: NextRequest) {
  // DEVELOPMENT MODE: Bypass authentication for testing
  if (process.env.NODE_ENV === 'development') {
    try {
      const tenantContext = getTenantFromRequest(request);
      if (!tenantContext) {
        return NextResponse.json(
          { error: 'Tenant context not found' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const queryParams = commissionsQuerySchema.parse({
        caseId: searchParams.get("caseId") || undefined,
        status: searchParams.get("status") || undefined,
        type: searchParams.get("type") || undefined,
        limit: searchParams.get("limit") || '100',
        offset: searchParams.get("offset") || '0',
      });

      const { caseId, status, type, limit, offset } = queryParams;

      return await withTenantContext(tenantContext.tenantId, async (prisma) => {
        // Build where clause - show all commissions in dev mode
        const where: any = {};

        if (caseId) where.caseId = caseId;
        if (status) where.status = status;
        if (type) where.type = type;

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

        const totals = await prisma.commission.groupBy({
          by: ["status"],
          where,
          _sum: {
            amount: true,
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
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.issues },
          { status: 400 }
        );
      }
      console.error("List commissions error (dev mode):", error);
      return NextResponse.json(
        { error: error.message || "Failed to list commissions" },
        { status: 500 }
      );
    }
  }

  // PRODUCTION MODE: Require authentication
  return await withVerifiedTenant(request, async ({ user, tenantId }, prisma) => {
    try {
      const { searchParams } = new URL(request.url);

      // Validate query parameters
      const queryParams = commissionsQuerySchema.parse({
        caseId: searchParams.get("caseId") || undefined,
        status: searchParams.get("status") || undefined,
        type: searchParams.get("type") || undefined,
        limit: searchParams.get("limit") || '100',
        offset: searchParams.get("offset") || '0',
      });

      const { caseId, status, type, limit, offset } = queryParams;

      // Build where clause - filter by tenant AND authenticated user
      const where: any = {
        tenantId: tenantId,
        userId: user.id,
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
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.issues },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error("List commissions error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to list commissions" },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/commissions
 * Update commission status (tenant-scoped)
 */
export async function PATCH(request: NextRequest) {
  return await withVerifiedTenant(request, async ({ user, tenantId }, prisma) => {
    try {
      const body = await request.json();

      // Validate request body
      const validatedData = updateCommissionSchema.parse(body);
      const { id, status, notes } = validatedData;

      // Check if user owns this commission AND it belongs to the tenant
      const existingCommission = await prisma.commission.findFirst({
        where: {
          id,
          tenantId: tenantId,
          userId: user.id,
        },
      });

      if (!existingCommission) {
        return NextResponse.json(
          { error: "Commission not found or you do not have permission to modify it" },
          { status: 403 }
        );
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
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error("Update commission error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update commission" },
        { status: 500 }
      );
    }
  });
}
