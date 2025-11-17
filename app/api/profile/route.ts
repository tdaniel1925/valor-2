import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, using a mock user ID
    // TODO: Replace with actual auth user ID from Supabase
    const userId = "demo-user-id";

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const userId = "demo-user-id"; // TODO: Get from auth
    const body = await request.json();

    const { firstName, lastName, phone, profile } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        profile: profile
          ? {
              upsert: {
                create: profile,
                update: profile,
              },
            }
          : undefined,
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
