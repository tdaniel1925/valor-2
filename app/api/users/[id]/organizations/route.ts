import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/users/[id]/organizations - Get user's organizations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const members = await prisma.organizationMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    // Filter out members with null organizations and map to expected format
    const organizations = members
      .filter((member) => member.organization !== null)
      .map((member) => ({
        ...member,
        organization: {
          id: member.organization!.id,
          name: member.organization!.name,
          type: member.organization!.type,
          status: member.organization!.status,
        },
      }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch user organizations" },
      { status: 500 }
    );
  }
}
