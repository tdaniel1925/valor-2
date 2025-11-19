import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/users/[id]/organizations - Get user's organizations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const organizations = await prisma.organizationMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch user organizations" },
      { status: 500 }
    );
  }
}
