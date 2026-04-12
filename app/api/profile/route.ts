import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";
import { updateProfileSchema } from "@/lib/validation/profile-schemas";
import { z } from "zod";

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const userId = authUser.id;

    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!userWithProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userWithProfile });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    const user = await requireAuth(request);
    const userId = user.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateProfileSchema.parse(body);

    // Build update data object
    const updateData: any = {};
    if (validatedData.firstName !== undefined) {
      updateData.firstName = validatedData.firstName;
    }
    if (validatedData.lastName !== undefined) {
      updateData.lastName = validatedData.lastName;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.profile) {
      updateData.profile = {
        upsert: {
          create: validatedData.profile,
          update: validatedData.profile,
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        profile: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
