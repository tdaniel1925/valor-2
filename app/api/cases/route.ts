import { NextRequest, NextResponse } from "next/server";
import { withVerifiedTenant } from "@/lib/auth/require-tenant-access";

// GET /api/cases - Get all cases for current tenant
export async function GET(request: NextRequest) {
  return await withVerifiedTenant(request, async ({ user, tenantId }, prisma) => {
    try {
      // User is authenticated and verified to belong to this tenant
      // All queries automatically scoped via RLS
      const cases = await prisma.case.findMany({
        where: {
          tenantId: tenantId,
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
        include: {
          quote: {
            select: {
              id: true,
              type: true,
              carrier: true,
              premium: true,
              status: true,
            },
          },
        },
      });

      return NextResponse.json({ cases });
    } catch (error) {
      console.error("Error fetching cases:", error);
      return NextResponse.json(
        { error: "Failed to fetch cases" },
        { status: 500 }
      );
    }
  });
}
