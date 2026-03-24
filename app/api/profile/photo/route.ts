import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";

// POST /api/profile/photo - Update profile photo URL
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userId = user.id;

    const { photoUrl } = await request.json();

    // Update user profile with photo URL
    await prisma.userProfile.update({
      where: { userId },
      data: { photoUrl },
    });

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    return NextResponse.json(
      { error: "Failed to update profile photo" },
      { status: 500 }
    );
  }
}
