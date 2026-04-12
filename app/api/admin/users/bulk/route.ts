import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/server-auth";
import { bulkUserOperationSchema } from "@/lib/validation/admin-schemas";
import { ZodError } from "zod";

// POST /api/admin/users/bulk - Perform bulk operations on users
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireAdmin(request);

    const body = await request.json();

    // Validate input with Zod
    const validatedData = bulkUserOperationSchema.parse(body);
    const { action, userIds, data } = validatedData;

    let result;

    switch (action) {
      case "updateRole":
        if (!data?.role) {
          return NextResponse.json(
            { error: "Role is required for updateRole action" },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role },
        });
        break;

      case "updateStatus":
        if (!data?.status) {
          return NextResponse.json(
            { error: "Status is required for updateStatus action" },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: data.status },
        });
        break;

      case "assignOrganization":
        if (!data?.organizationId) {
          return NextResponse.json(
            { error: "Organization ID is required for assignOrganization action" },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { organizationId: data.organizationId },
        });
        break;

      case "delete":
        // Use deleteMany for bulk deletion
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully performed ${action} on ${result.count} user(s)`,
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
