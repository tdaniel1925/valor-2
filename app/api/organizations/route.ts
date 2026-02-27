import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/get-tenant-context";
import { withTenantContext } from "@/lib/db/tenant-scoped-prisma";

// GET /api/organizations - Get all organizations (tenant-scoped)
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") === "true";

    const organizations = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.organization.findMany({
        where: {
          tenantId: tenantContext.tenantId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          children: includeChildren
            ? {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                },
              }
            : false,
          members: {
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
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization (tenant-scoped)
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // TODO: Add admin/manager auth check

    const body = await request.json();
    const {
      name,
      type,
      parentId,
      ein,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const organization = await withTenantContext(tenantContext.tenantId, async (db) => {
      // If parentId provided, verify it belongs to same tenant
      if (parentId) {
        const parent = await db.organization.findFirst({
          where: {
            id: parentId,
            tenantId: tenantContext.tenantId,
          },
        });

        if (!parent) {
          throw new Error("Parent organization not found in this tenant");
        }
      }

      return await db.organization.create({
        data: {
          tenantId: tenantContext.tenantId,
          name,
          type,
          parentId: parentId || null,
          ein,
          phone,
          email,
          address,
          city,
          state,
          zipCode,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ organization });
  } catch (error: any) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create organization" },
      { status: 500 }
    );
  }
}

// PUT /api/organizations - Update organization (tenant-scoped)
export async function PUT(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // TODO: Add admin/manager auth check

    const body = await request.json();
    const {
      id,
      name,
      type,
      parentId,
      ein,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const organization = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Verify organization belongs to tenant
      const existing = await db.organization.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });

      if (!existing) {
        throw new Error("Organization not found in this tenant");
      }

      // If changing parent, verify new parent belongs to same tenant
      if (parentId !== undefined && parentId) {
        const parent = await db.organization.findFirst({
          where: {
            id: parentId,
            tenantId: tenantContext.tenantId,
          },
        });

        if (!parent) {
          throw new Error("Parent organization not found in this tenant");
        }
      }

      return await db.organization.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(parentId !== undefined && { parentId: parentId || null }),
          ...(ein !== undefined && { ein }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(zipCode !== undefined && { zipCode }),
          ...(status && { status }),
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ organization });
  } catch (error: any) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations - Delete organization (tenant-scoped)
export async function DELETE(request: NextRequest) {
  try {
    const tenantContext = getTenantContext(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Tenant context not found" },
        { status: 400 }
      );
    }

    // TODO: Add admin auth check

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    await withTenantContext(tenantContext.tenantId, async (db) => {
      // Verify organization belongs to tenant
      const existing = await db.organization.findFirst({
        where: {
          id,
          tenantId: tenantContext.tenantId,
        },
      });

      if (!existing) {
        throw new Error("Organization not found in this tenant");
      }

      // Check if organization has children
      const hasChildren = await db.organization.count({
        where: {
          parentId: id,
          tenantId: tenantContext.tenantId,
        },
      });

      if (hasChildren > 0) {
        throw new Error("Cannot delete organization with child organizations");
      }

      await db.organization.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    );
  }
}
