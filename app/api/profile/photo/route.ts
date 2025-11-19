import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// POST /api/profile/photo - Update profile photo URL
export async function POST(request: NextRequest) {
  try {
    // For demo purposes, using the demo user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

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
