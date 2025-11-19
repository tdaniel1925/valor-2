import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/organizations - Get all organizations
export async function GET(request: NextRequest) {
  try {
    // TODO: Add auth check and filter by user's organizations

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get("includeChildren") === "true";

    const organizations = await prisma.organization.findMany({
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
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
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

    const organization = await prisma.organization.create({
      data: {
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

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

// PUT /api/organizations - Update organization
export async function PUT(request: NextRequest) {
  try {
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

    const organization = await prisma.organization.update({
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

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations - Delete organization
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin auth check

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if organization has children
    const hasChildren = await prisma.organization.count({
      where: { parentId: id },
    });

    if (hasChildren > 0) {
      return NextResponse.json(
        { error: "Cannot delete organization with child organizations" },
        { status: 400 }
      );
    }

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
